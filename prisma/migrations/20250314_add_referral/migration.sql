-- Add referral fields to users table
ALTER TABLE `users`
  ADD COLUMN `referralCode`   VARCHAR(20) NULL UNIQUE AFTER `isActive`,
  ADD COLUMN `referredByCode` VARCHAR(20) NULL AFTER `referralCode`;

ALTER TABLE `users`
  ADD INDEX `users_referral_code_idx` (`referralCode`);

-- Create referrals table
CREATE TABLE `referrals` (
  `id`          VARCHAR(191) NOT NULL,
  `referrerId`  VARCHAR(191) NOT NULL,
  `refereeId`   VARCHAR(191) NOT NULL,
  `totalEarned` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY `referrals_refereeId_key` (`refereeId`),
  INDEX  `referrals_referrerId_idx` (`referrerId`),

  PRIMARY KEY (`id`),
  CONSTRAINT `referrals_referrerId_fkey`
    FOREIGN KEY (`referrerId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referrals_refereeId_fkey`
    FOREIGN KEY (`refereeId`)  REFERENCES `users` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
