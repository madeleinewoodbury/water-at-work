-- Migration 015: Add new notification types and optional link column
-- Extends notifications to support kick, leave, and account deletion events,
-- plus clickable links in notifications.

-- 1. Expand the type CHECK constraint
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'join_request',
    'request_approved',
    'request_rejected',
    'team_deleted',
    'member_kicked',
    'member_left'
  ));

-- 2. Add nullable link column for clickable notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link TEXT;
