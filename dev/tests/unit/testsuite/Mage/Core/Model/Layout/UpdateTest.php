<?php
/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
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
 * @category    Magento
 * @package     Mage_Core
 * @subpackage  unit_tests
 * @copyright   Copyright (c) 2013 X.commerce, Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

class Mage_Core_Model_Layout_UpdateTest extends PHPUnit_Framework_TestCase
{
    /**
     * Test formatted time data
     */
    const TEST_FORMATTED_TIME = 'test_time';

    public function testBeforeSave()
    {
        $resourceModel = $this->getMock(
            'Mage_Core_Model_Resource_Layout_Update',
            array('formatDate', 'getIdFieldName', 'beginTransaction', 'save', 'addCommitCallback', 'commit'),
            array(),
            '',
            false
        );
        $resourceModel->expects($this->once())
            ->method('formatDate')
            ->with($this->isType('int'))
            ->will($this->returnValue(self::TEST_FORMATTED_TIME));
        $resourceModel->expects($this->once())
            ->method('addCommitCallback')
            ->will($this->returnSelf());

        $helper = new Magento_Test_Helper_ObjectManager($this);
        /** @var $model Mage_Core_Model_Layout_Update */
        $model = $helper->getModel('Mage_Core_Model_Layout_Update', array('resource' => $resourceModel));
        $model->setId(0); // set any data to set _hasDataChanges flag
        $model->save();

        $this->assertEquals(self::TEST_FORMATTED_TIME, $model->getUpdatedAt());
    }
}
