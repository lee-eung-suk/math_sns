import { supabase } from './supabaseClient';

export { supabase };

export type Domain = '수와 연산' | '변화와 관계' | '도형과 측정' | '자료와 가능성' | '기타';
export type Grade = '1학년' | '2학년' | '3학년' | '4학년' | '5학년' | '6학년' | '공통';

export interface Post {
  id: string;
  title: string;
  description: string;
  url: string;
  categories: Domain[];
  grades: Grade[];
  thumbnail: string;
  image_url?: string;
  thumbnail_url?: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_name: string;
  parent_id?: string;
  created_at: string;
}

let mockComments: Comment[] = [];
let mockPosts: Post[] = [];

export const getComments = async (postId: string): Promise<Comment[]> => {
  if (!supabase) {
    return mockComments.filter(c => c.post_id === postId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Network error fetching comments:', e);
    return [];
  }
};

export const createComment = async (postId: string, content: string, authorName: string, parentId?: string): Promise<Comment | null> => {
  const commentData = {
      post_id: postId,
      content,
      author_name: authorName || '익명',
      parent_id: parentId || null
  };

  const saveMock = () => {
    const newComment: Comment = {
      ...commentData,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString()
    };
    mockComments = [newComment, ...mockComments];
    return newComment;
  };

  if (!supabase) return saveMock();

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating comment:', error);
      if (error.message.includes('fetch')) return saveMock();
      throw new Error(error.message);
    }
    return data;
  } catch (e: any) {
    if (e.message?.includes('fetch')) return saveMock();
    throw e;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  const deleteMock = () => {
    mockComments = mockComments.filter(c => c.id !== commentId && c.parent_id !== commentId);
    return true;
  };
  
  if (!supabase) return deleteMock();
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .or(`id.eq.${commentId},parent_id.eq.${commentId}`)
      .select();
      
    if (error) {
      console.error('Error deleting comment:', error);
      if (error.message.includes('fetch')) return deleteMock();
      throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Supabase 권한 부족: comments 테이블의 삭제(Delete) 권한이 허용되지 않았습니다.');
    }
    
    return true;
  } catch (e: any) {
    if (e.message?.includes('fetch')) return deleteMock();
    throw e;
  }
};

export const getPosts = async (filters?: { domain?: Domain | '전체', grade?: Grade | '전체' }): Promise<Post[]> => {
  const getMockResult = () => {
    let result = [...mockPosts];
    if (filters?.domain && filters.domain !== '전체') {
      result = result.filter(p => p.categories.includes(filters.domain as Domain));
    }
    if (filters?.grade && filters.grade !== '전체') {
      result = result.filter(p => p.grades.includes(filters.grade as Grade));
    }
    return result.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  if (!supabase) {
    return getMockResult();
  }

  try {
    let query = supabase.from('tools').select('*').order('created_at', { ascending: false });
    
    if (filters?.domain && filters.domain !== '전체') {
      query = query.contains('categories', [filters.domain]);
    }
    if (filters?.grade && filters.grade !== '전체') {
      query = query.contains('grades', [filters.grade]);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tools:', error);
      return getMockResult();
    }
    return data || [];
  } catch (e) {
    console.error('Network error fetching tools, falling back to mock:', e);
    return getMockResult();
  }
};

export const createPost = async (
  postData: Omit<Post, 'id' | 'view_count' | 'like_count' | 'created_at'>
): Promise<Post | null> => {
  const saveMock = () => {
    const newPost: Post = {
      ...postData,
      id: Math.random().toString(36).substring(7),
      view_count: 0,
      like_count: 0,
      created_at: new Date().toISOString()
    };
    mockPosts = [newPost, ...mockPosts];
    return newPost;
  };

  if (!supabase) {
    return saveMock();
  }

  try {
    const { data, error, status, statusText } = await supabase
      .from('tools')
      .insert([postData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status,
        statusText
      });
      // If it's a structural error, we probably shouldn't mock-save silently, 
      // but "Failed to fetch" is a connectivity issue.
      if (error.message.includes('fetch')) return saveMock();
      throw new Error(`${error.message} (Code: ${error.code})`);
    }
    return data;
  } catch (e: any) {
    if (e.message?.includes('fetch')) {
      return saveMock();
    }
    throw e;
  }
};

export const incrementView = async (postId: string): Promise<void> => {
  const mockIncrement = () => {
    const post = mockPosts.find(p => p.id === postId);
    if (post) post.view_count += 1;
  };

  if (!supabase) {
    mockIncrement();
    return;
  }

  try {
    const { data: post, error: fetchError } = await supabase.from('tools').select('view_count').eq('id', postId).single();
    if (fetchError) throw fetchError;
    if (post) {
        await supabase.from('tools').update({ view_count: post.view_count + 1 }).eq('id', postId);
    }
  } catch (e: any) {
    console.error('Error incrementing view:', e);
    if (e.message?.includes('fetch')) mockIncrement();
  }
};

export const toggleLike = async (postId: string, liked: boolean): Promise<void> => {
  const mockToggle = () => {
    const post = mockPosts.find(p => p.id === postId);
    if (post) post.like_count += liked ? 1 : -1;
  };

  if (!supabase) {
    mockToggle();
    return;
  }

  try {
    const { data: post, error: fetchError } = await supabase.from('tools').select('like_count').eq('id', postId).single();
    if (fetchError) throw fetchError;
    if (post) {
        await supabase.from('tools').update({ like_count: post.like_count + (liked ? 1 : -1) }).eq('id', postId);
    }
  } catch (e: any) {
    console.error('Error toggling like:', e);
    if (e.message?.includes('fetch')) mockToggle();
  }
}

export const updatePost = async (postId: string, postData: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>) => {
  const dataWithUpdate = { ...postData };
  
  const mockUpdate = () => {
    const index = mockPosts.findIndex(p => p.id === postId);
    if (index !== -1) {
      mockPosts[index] = { ...mockPosts[index], ...dataWithUpdate };
      return mockPosts[index];
    }
    return null;
  };

  if (!supabase) {
    return mockUpdate();
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .update(dataWithUpdate)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
       if (error.message.includes('fetch')) return mockUpdate();
       throw new Error(error.message);
    }
    return data;
  } catch (e: any) {
    if (e.message?.includes('fetch')) return mockUpdate();
    throw e;
  }
};

export const deletePost = async (postId: string) => {
  const mockDelete = () => {
    mockPosts = mockPosts.filter(p => p.id !== postId);
  };

  if (!supabase) {
    mockDelete();
    return;
  }

  try {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', postId);

    if (error) {
      if (error.message.includes('fetch')) {
        mockDelete();
        return;
      }
      throw new Error(error.message);
    }
  } catch (e: any) {
    if (e.message?.includes('fetch')) {
      mockDelete();
      return;
    }
    throw e;
  }
};
