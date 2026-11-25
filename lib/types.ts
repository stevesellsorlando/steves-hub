import type { ListKey } from "./constants";

export type Person = {
  id: string;
  list: ListKey;
  name: string;
  stage: string | null;
  buyer_seller: string | null;
  agreement: string | null;
  lead_source: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  email2: string | null;
  address: string | null;
  property_address: string | null;
  tags: string[];
  timeframe: string | null;
  price_in_mind: string | null;
  reason_selling: string | null;
  moving_to: string | null;
  mortgage_status: string | null;
  preapproved: string | null;
  lender: string | null;
  price_range: string | null;
  closing_date: string | null;
  best_time_to_call: string | null;
  preferred_contact: string | null;
  social_media: string | null;
  birthday: string | null;
  home_anniversary: string | null;
  kids: string | null;
  deceased_name: string | null;
  relationship: string | null;
  attorney_name: string | null;
  attorney_phone: string | null;
  case_number: string | null;
  date_filed: string | null;
  mls_number: string | null;
  list_price: string | null;
  expired_date: string | null;
  previous_agent: string | null;
  last_contacted_at: string | null;
  created_at: string;
  phones?: Labeled[] | null;
  emails?: Labeled[] | null;
  addresses?: Labeled[] | null;
};

export type Labeled = { value: string; label: string | null };

export type Relationship = { id: string; person_id: string; label: string | null; name: string; phone: string | null; email: string | null; address: string | null };

export type Note = { id: string; person_id: string; kind: string; body: string; created_at: string };

export type Task = {
  id: string;
  person_id: string | null;
  title: string;
  type: string;
  due_date: string;
  done_at: string | null;
  assigned_to?: string | null;
  due_time?: string | null;
  fub_task_id?: number | null;
  people?: { name: string; list: ListKey; phone: string | null } | null;
};
