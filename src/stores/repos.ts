import { MockBlockRepository } from "@/repository/block/mock_repo";
import { SupabaseBlockRepository } from "@/repository/block/supabase_repo";

export const mockBlockRepository = new MockBlockRepository();
export const supabaseBlockRepository = new SupabaseBlockRepository();
