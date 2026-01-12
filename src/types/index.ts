// ユーザー（管理者）
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
}

// イベント（日程調整案件）
export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration: number; // 所要時間（分）
  deadline?: Date;
  status: 'active' | 'closed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// 日時候補
export interface TimeSlot {
  id: string;
  event_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  created_at: Date;
}

// 回答者
export interface Respondent {
  id: string;
  event_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// 回答
export type ResponseStatus = 'ok' | 'ng' | 'maybe';

export interface Response {
  id: string;
  respondent_id: string;
  time_slot_id: string;
  status: ResponseStatus;
  comment?: string;
  created_at: Date;
  updated_at: Date;
}

// フロントエンド用の拡張型
export interface EventWithSlots extends Event {
  time_slots: TimeSlot[];
  respondent_count: number;
}

export interface TimeSlotWithResponses extends TimeSlot {
  responses: ResponseWithRespondent[];
}

export interface ResponseWithRespondent extends Response {
  respondent: Respondent;
}

// 日付ごとにグループ化したスロット
export interface DateGroup {
  date: string;
  slots: TimeSlot[];
}

// 回答フォーム用
export interface ResponseFormData {
  name: string;
  responses: {
    time_slot_id: string;
    status: ResponseStatus;
    comment?: string;
  }[];
}

// カレンダー連携用
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export interface AvailableSlot {
  date: string;
  start_time: string;
  end_time: string;
  selected: boolean;
}

// API レスポンス
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
