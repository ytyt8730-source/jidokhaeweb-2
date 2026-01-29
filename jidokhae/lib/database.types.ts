// Supabase 데이터베이스 타입 정의
// schema.sql 기반으로 생성됨
// 실제 프로젝트 연결 시 `npx supabase gen types typescript` 명령으로 재생성 권장

// M2 ENUM 타입
export type RegistrationStatus =
  | 'pending_transfer'  // 입금 대기
  | 'confirmed'         // 신청 완료 (입금 확인됨)
  | 'cancelled'         // 취소됨
  | 'expired'           // 만료됨 (48시간 미입금)
  | 'waiting'           // 대기 중

export type PaymentMethod =
  | 'bank_transfer'     // 계좌이체
  | 'pg'                // PG 결제 (M3+)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          nickname: string
          phone: string | null
          auth_type: 'email' | 'kakao'
          role: 'member' | 'admin' | 'super_admin'
          is_new_member: boolean
          first_regular_meeting_at: string | null
          last_regular_meeting_at: string | null
          total_participations: number
          consecutive_weeks: number
          total_praises_received: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          nickname: string
          phone?: string | null
          auth_type?: 'email' | 'kakao'
          role?: 'member' | 'admin' | 'super_admin'
          is_new_member?: boolean
          first_regular_meeting_at?: string | null
          last_regular_meeting_at?: string | null
          total_participations?: number
          consecutive_weeks?: number
          total_praises_received?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          nickname?: string
          phone?: string | null
          auth_type?: 'email' | 'kakao'
          role?: 'member' | 'admin' | 'super_admin'
          is_new_member?: boolean
          first_regular_meeting_at?: string | null
          last_regular_meeting_at?: string | null
          total_participations?: number
          consecutive_weeks?: number
          total_praises_received?: number
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          meeting_type: 'regular' | 'discussion' | 'special'
          datetime: string
          location: string
          capacity: number
          fee: number
          description: string | null
          status: 'open' | 'closed' | 'cancelled'
          refund_policy_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          meeting_type?: 'regular' | 'discussion' | 'special'
          datetime: string
          location: string
          capacity?: number
          fee: number
          description?: string | null
          status?: 'open' | 'closed' | 'cancelled'
          refund_policy_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          meeting_type?: 'regular' | 'discussion' | 'special'
          datetime?: string
          location?: string
          capacity?: number
          fee?: number
          description?: string | null
          status?: 'open' | 'closed' | 'cancelled'
          refund_policy_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          meeting_id: string
          // M2 registration_status enum
          status: RegistrationStatus
          payment_method: PaymentMethod
          payment_amount: number | null
          // 계좌이체 전용 (M2)
          depositor_name: string | null       // 입금자명 (MMDD_실명)
          deposit_deadline: string | null     // 48시간 마감
          confirmed_at: string | null         // 운영자 확인 시간
          confirmed_by: string | null         // 입금 확인한 운영자
          // 취소 정보
          cancelled_at: string | null
          cancel_reason: string | null
          // 환불 계좌 (M2 - 분리된 필드)
          refund_bank: string | null
          refund_account: string | null
          refund_holder: string | null
          refund_amount: number | null
          refund_completed_at: string | null
          // 참가 정보
          participation_status: 'completed' | 'no_show' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id: string
          status?: RegistrationStatus
          payment_method?: PaymentMethod
          payment_amount?: number | null
          depositor_name?: string | null
          deposit_deadline?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          refund_bank?: string | null
          refund_account?: string | null
          refund_holder?: string | null
          refund_amount?: number | null
          refund_completed_at?: string | null
          participation_status?: 'completed' | 'no_show' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string
          status?: RegistrationStatus
          payment_method?: PaymentMethod
          payment_amount?: number | null
          depositor_name?: string | null
          deposit_deadline?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          refund_bank?: string | null
          refund_account?: string | null
          refund_holder?: string | null
          refund_amount?: number | null
          refund_completed_at?: string | null
          participation_status?: 'completed' | 'no_show' | null
          created_at?: string
          updated_at?: string
        }
      }
      waitlists: {
        Row: {
          id: string
          user_id: string
          meeting_id: string
          position: number
          notified_at: string | null
          response_deadline: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id: string
          position: number
          notified_at?: string | null
          response_deadline?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string
          position?: number
          notified_at?: string | null
          response_deadline?: string | null
          created_at?: string
        }
      }
      refund_policies: {
        Row: {
          id: string
          meeting_type: string
          days_before: number
          refund_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          meeting_type: string
          days_before: number
          refund_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          meeting_type?: string
          days_before?: number
          refund_rate?: number
          created_at?: string
        }
      }
      praises: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          meeting_id: string
          message_type: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          meeting_id: string
          message_type: string
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          meeting_id?: string
          message_type?: string
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          earned_at?: string
        }
      }
      bookshelf: {
        Row: {
          id: string
          user_id: string
          book_title: string
          book_author: string | null
          one_line_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_title: string
          book_author?: string | null
          one_line_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_title?: string
          book_author?: string | null
          one_line_note?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          meeting_id: string
          content: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id: string
          content: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string
          content?: string
          is_public?: boolean
          created_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string
          meeting_id: string
          content: string
          response: string | null
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id: string
          content: string
          response?: string | null
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string
          content?: string
          response?: string | null
          responded_at?: string | null
          created_at?: string
        }
      }
      notification_templates: {
        Row: {
          id: string
          type: string
          title: string
          content: string
          send_timing: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          content: string
          send_timing?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          content?: string
          send_timing?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          meeting_id: string | null
          sent_at: string
          status: 'sent' | 'failed'
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          meeting_id?: string | null
          sent_at?: string
          status?: 'sent' | 'failed'
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          meeting_id?: string | null
          sent_at?: string
          status?: 'sent' | 'failed'
          error_message?: string | null
        }
      }
      admin_permissions: {
        Row: {
          id: string
          user_id: string
          permission: string
          granted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          permission: string
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          permission?: string
          granted_at?: string
        }
      }
      banners: {
        Row: {
          id: string
          title: string
          image_url: string
          link_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 편의 타입
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// 자주 사용하는 타입 별칭
export type User = Tables<'users'>
export type Meeting = Tables<'meetings'>
export type Registration = Tables<'registrations'>
export type Waitlist = Tables<'waitlists'>
export type RefundPolicy = Tables<'refund_policies'>
export type Praise = Tables<'praises'>
export type Badge = Tables<'badges'>
export type Book = Tables<'bookshelf'>
export type Review = Tables<'reviews'>
export type Suggestion = Tables<'suggestions'>
export type Banner = Tables<'banners'>
