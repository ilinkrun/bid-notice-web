-- 마크다운 원본을 저장할 필드 추가
ALTER TABLE board_dev ADD COLUMN markdown_source TEXT NULL COMMENT '마크다운 원본 텍스트' AFTER content;