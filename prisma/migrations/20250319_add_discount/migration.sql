-- เพิ่ม discountPct และ discountAmount ใน bet_items (บันทึกส่วนลด ณ เวลาแทง)
ALTER TABLE `bet_items`
  ADD COLUMN `discount_pct`    DECIMAL(5,2)  NOT NULL DEFAULT 0.00 COMMENT 'ส่วนลด % ณ เวลาแทง',
  ADD COLUMN `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดส่วนลด (บาท)';

-- seed ค่าเริ่มต้น discount 0% ใน core_settings
INSERT INTO `core_settings` (`group`, `key`, `type`, `value_decimal`, `updated_by`, `created_at`, `updated_at`)
VALUES ('lottery', 'lottery.discount_pct', 'decimal', 0.00, 'system', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
