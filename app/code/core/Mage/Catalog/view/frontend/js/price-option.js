/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    frontend product price option
 * @package     mage
 * @copyright   Copyright (c) 2013 X.commerce, Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
/*jshint evil:true browser:true jquery:true*/

(function($, undefined) {
    "use strict";
    $.widget('mage.priceOption', {
        options: {
            productCustomSelector: '.product-custom-option',
            mapPopupPrice: '#map-popup-price',
            prices: {},
            priceTemplate: '<span class="price">${formattedPrice}</span>'
        },
        _create: function() {

            this.element.on('changePrice', $.proxy(function(e, data) {
                this.changePrice(data.config, data.price);
            }, this)).on('reloadPrice', $.proxy(function() {
                this.reloadPrice();
            }, this));

            $(this.options.productCustomSelector).each(
                $.proxy(function(key, value) {
                    var element = $(value),
                        inputs = element.filter(":input"),
                        isNotCheckboxRadio = inputs.is(':not(":checkbox, :radio")');
                    element.on((isNotCheckboxRadio ? 'change' : 'click'), $.proxy(this.reloadPrice, this));
                }, this)
            );
        },
        _formatCurrency: function(price, format, showPlus) {
            var precision = isNaN(format.requiredPrecision = Math.abs(format.requiredPrecision)) ? 2 : format.requiredPrecision,
                integerRequired = isNaN(format.integerRequired = Math.abs(format.integerRequired)) ? 1 : format.integerRequired,
                decimalSymbol = format.decimalSymbol === undefined ? "," : format.decimalSymbol,
                groupSymbol = format.groupSymbol === undefined ? "." : format.groupSymbol,
                groupLength = format.groupLength === undefined ? 3 : format.groupLength,
                s = '';

            if (showPlus === undefined || showPlus === true) {
                s = price < 0 ? "-" : ( showPlus ? "+" : "");
            } else if (showPlus === false) {
                s = '';
            }
            var i = parseInt(price = Math.abs(+price || 0).toFixed(precision), 10) + '',
                pad = (i.length < integerRequired) ? (integerRequired - i.length) : 0;
            while (pad) {
                i = '0' + i;
                pad--;
            }
            var j = i.length > groupLength ? i.length % groupLength : 0,
                re = new RegExp("(\\d{" + groupLength + "})(?=\\d)", "g");

            /**
             * replace(/-/, 0) is only for fixing Safari bug which appears
             * when Math.abs(0).toFixed() executed on "0" number.
             * Result is "0.-0" :(
             */
            var r = (j ? i.substr(0, j) + groupSymbol : "") + i.substr(j).replace(re, "$1" + groupSymbol) +
                    (precision ? decimalSymbol + Math.abs(price - i).toFixed(precision).replace(/-/, 0).slice(2) : ""),
                pattern = format.pattern.indexOf('{sign}') < 0 ? s + format.pattern : format.pattern.replace('{sign}', s);
            return pattern.replace('%s', r).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        },
        changePrice: function(key, price) {
            this.options.prices[key] = price;
        },
        _getOptionPrices: function() {
            var price = 0,
                oldPrice = 0;
            $.each(this.options.prices, function(key, pair) {
                price += parseFloat(pair.price);
                oldPrice += parseFloat(pair.oldPrice);
            });
            var result = [price, oldPrice];
            return result;
        },
        reloadPrice: function() {
            if (this.options.priceConfig) {
                var skipIds = [],
                    priceSelectors = [
                        '#product-price-' + this.options.priceConfig.productId,
                        '#bundle-price-' + this.options.priceConfig.productId,
                        '#price-including-tax-' + this.options.priceConfig.productId,
                        '#price-excluding-tax-' + this.options.priceConfig.productId,
                        '#old-price-' + this.options.priceConfig.productId
                    ],
                    getOptionPrices = this._getOptionPrices(),
                    optionPrice = {
                        excludeTax: 0,
                        includeTax: 0,
                        oldPrice: 0,
                        price: 0,
                        update: function(price, excludeTax, includeTax, oldPrice) {
                            this.price += price;
                            this.excludeTax += excludeTax;
                            this.includeTax += includeTax;
                            this.oldPrice += oldPrice;
                        }
                    };
                $(this.options.productCustomSelector).each($.proxy(function(key, elements) {
                    var element = $(elements);
                    var optionIdStartIndex, optionIdEndIndex;
                    if (element.is(":file")) {
                        optionIdStartIndex = element.attr('name').indexOf('_') + 1;
                        optionIdEndIndex = element.attr('name').lastIndexOf('_');
                    } else {
                        optionIdStartIndex = element.attr('name').indexOf('[') + 1;
                        optionIdEndIndex = element.attr('name').indexOf(']');
                    }
                    var optionId = parseInt(element.attr('name').substring(optionIdStartIndex, optionIdEndIndex), 10);
                    if (this.options.optionConfig[optionId]) {
                        var configOptions = this.options.optionConfig[optionId];
                        if (element.is(":checkbox, :radio")) {
                            if (element.is(":checked")) {
                                if (configOptions[element.val()]) {
                                    optionPrice.update(configOptions[element.val()].price,
                                        configOptions[element.val()].excludeTax,
                                        configOptions[element.val()].includeTax,
                                        configOptions[element.val()].oldPrice);
                                }
                            }
                        } else if (element.hasClass('datetime-picker') && ($.inArray(optionId, skipIds) === -1)) {
                            var dateSelected = true;
                            $('.datetime-picker[id^="options_' + optionId + '"]').each(function() {
                                if ($(this).val() === '') {
                                    dateSelected = false;
                                }
                            });
                            if (dateSelected) {
                                optionPrice.update(configOptions.price, configOptions.excludeTax,
                                    configOptions.includeTax, configOptions.oldPrice);
                                skipIds[optionId] = optionId;
                            }
                        } else if (element.is('select')) {
                            element.find(':selected').each(function() {
                                if (configOptions[$(this).val()]) {
                                    optionPrice.update(configOptions[$(this).val()].price,
                                        configOptions[$(this).val()].excludeTax,
                                        configOptions[$(this).val()].includeTax,
                                        configOptions[$(this).val()].oldPrice);
                                }
                            });
                        } else if (element.is('textarea,:text')) {
                            if (element.val()) {
                                optionPrice.update(configOptions.price, configOptions.excludeTax,
                                    configOptions.includeTax, configOptions.oldPrice);
                            }
                        } else if (element.is(":file")) {
                            if (element.val() || element.parent('div').siblings().length > 0) {
                                optionPrice.update(configOptions.price, configOptions.excludeTax,
                                    configOptions.includeTax, configOptions.oldPrice);
                            }
                        }
                    }
                }, this));
                var updatedPrice = {
                    priceExclTax: optionPrice.excludeTax + this.options.priceConfig.priceExclTax,
                    priceInclTax: optionPrice.includeTax + this.options.priceConfig.priceInclTax,
                    productOldPrice: optionPrice.oldPrice + this.options.priceConfig.productOldPrice,
                    productPrice: optionPrice.price + this.options.priceConfig.productPrice
                };
                // Loop through each priceSelector and update price
                $.each(priceSelectors, $.proxy(function(index, value) {
                    var priceElement = $(value),
                        clone = $(value + this.options.priceConfig.idSuffix);
                    var isClone = false;
                    if (priceElement.length === 0) {
                        priceElement = clone;
                        isClone = true;
                    }
                    if (priceElement.length === 1) {
                        var price = 0;
                        if (value.indexOf('price-including-tax-') >= 0) {
                            price = updatedPrice.priceInclTax;
                        } else if (value.indexOf('price-excluding-tax-') >= 0) {
                            price = updatedPrice.priceExclTax;
                        } else if (value.indexOf('old-price-') >= 0) {
                            if (this.options.priceConfig.showIncludeTax || this.options.priceConfig.showBothPrices) {
                                price = updatedPrice.priceInclTax;
                            } else {
                                price = updatedPrice.priceExclTax;
                            }
                        } else {
                            price = this.options.priceConfig.showIncludeTax ?
                                updatedPrice.priceInclTax : updatedPrice.priceExclTax;
                        }

                        price = price + getOptionPrices[0];
                        var priceHtml = $.tmpl(this.options.priceTemplate, {'formattedPrice': this._formatCurrency(price, this.options.priceConfig.priceFormat)});
                        priceElement.html(priceHtml[0].outerHTML);
                        // If clone exists, update clone price as well
                        if (!isClone && clone.length === 1) {
                            clone.html(priceHtml[0].outerHTML);
                        }
                        $(this.options.mapPopupPrice).find(value).html(priceHtml);
                    }
                }, this));
            }
        }
    });
})(jQuery);