import { supabase } from './supabaseClient';

export { supabase };

export type Domain = '수와 연산' | '변화와 관계' | '도형과 측정' | '자료와 가능성' | '기타';
export type Grade = '1학년' | '2학년' | '3학년' | '4학년' | '5학년' | '6학년' | '공통';

export interface Post {
  id: string;
  title: string;
  content: string;
  url: string;
  domains: Domain[];
  grades: Grade[];
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  created_at: string;
  author_id?: string;
}

// In-memory mock data
let mockPosts: Post[] = [];

export const getPosts = async (filters?: { domain?: Domain | '전체', grade?: Grade | '전체' }): Promise<Post[]> => {
  if (!supabase) {
    let result = [...mockPosts];
    if (filters?.domain && filters.domain !== '전체') {
      result = result.filter(p => p.domains.includes(filters.domain as Domain));
    }
    if (filters?.grade && filters.grade !== '전체') {
      result = result.filter(p => p.grades.includes(filters.grade as Grade));
    }
    return result.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
  
  if (filters?.domain && filters.domain !== '전체') {
    query = query.contains('domains', [filters.domain]);
  }
  if (filters?.grade && filters.grade !== '전체') {
    query = query.contains('grades', [filters.grade]);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return data;
};

export const createPost = async (
  postData: Omit<Post, 'id' | 'view_count' | 'like_count' | 'created_at'>
): Promise<Post | null> => {
  if (!supabase) {
    const newPost: Post = {
      ...postData,
      id: Math.random().toString(36).substring(7),
      view_count: 0,
      like_count: 0,
      created_at: new Date().toISOString()
    };
    mockPosts = [newPost, ...mockPosts];
    return newPost;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([postData])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw new Error(error.message);
  }
  return data;
};

export const incrementView = async (postId: string): Promise<void> => {
  if (!supabase) {
    const post = mockPosts.find(p => p.id === postId);
    if (post) post.view_count += 1;
    return;
  }

  // Basic RPC or increment. For now we will invoke a simple update since we didn't add an RPC in SQL.
  // Actually, without RPC, we have to read then write, which is subject to race conditions.
  // We'll read first, then write.
  const { data: post } = await supabase.from('posts').select('view_count').eq('id', postId).single();
  if (post) {
      await supabase.from('posts').update({ view_count: post.view_count + 1 }).eq('id', postId);
  }
};

export const toggleLike = async (postId: string, liked: boolean): Promise<void> => {
  if (!supabase) {
    const post = mockPosts.find(p => p.id === postId);
    if (post) post.like_count += liked ? 1 : -1;
    return;
  }

  const { data: post } = await supabase.from('posts').select('like_count').eq('id', postId).single();
  if (post) {
      await supabase.from('posts').update({ like_count: post.like_count + (liked ? 1 : -1) }).eq('id', postId);
  }
}
