# Query Optimization Guide

This document outlines the query optimization strategies implemented in the Friend Furlough application.

## Current Optimizations

### 1. Batch Fetching
**Location**: `chatStore.ts` - `loadConversations()`

**Strategy**: Instead of fetching participants one by one, we fetch all participants for all conversations in a single query.

```typescript
// ✅ GOOD: Single batch query
const { data: allParticipants } = await supabase
  .from('conversation_participants')
  .select('...')
  .in('conversation_id', conversationIds);

// ❌ BAD: Multiple queries in a loop
for (const convId of conversationIds) {
  const { data } = await supabase
    .from('conversation_participants')
    .select('...')
    .eq('conversation_id', convId);
}
```

### 2. Cursor-Based Pagination
**Location**: `CommunityPage.tsx` - `loadPosts()`

**Strategy**: Use cursor-based pagination for infinite scroll instead of offset-based pagination.

```typescript
// ✅ GOOD: Cursor-based pagination
if (loadMore && lastPost) {
  query = query.lt('created_at', lastPost.created_at);
}

// ❌ BAD: Offset-based pagination
query = query.offset(pageNumber * pageSize);
```

**Benefits**:
- More efficient for large datasets
- Handles concurrent updates better
- Prevents duplicate/missing records

### 3. Parallel Data Loading
**Location**: Multiple stores and pages

**Strategy**: Use `Promise.all()` to fetch independent data in parallel.

```typescript
// ✅ GOOD: Parallel fetching
await Promise.all([
  loadMultiplePostReactions(postIds, 'like'),
  loadMultiplePostComments(postIds)
]);

// ❌ BAD: Sequential fetching
await loadMultiplePostReactions(postIds, 'like');
await loadMultiplePostComments(postIds);
```

### 4. Selective Field Selection
**Location**: All queries

**Strategy**: Only select fields you need instead of `SELECT *`.

```typescript
// ✅ GOOD: Specific fields
.select('id, name, avatar_url, country_flag')

// ❌ BAD: All fields
.select('*')
```

**Benefits**:
- Reduces bandwidth
- Faster query execution
- Smaller payload size

### 5. Efficient Joins
**Location**: `chatStore.ts` - `loadConversations()`

**Strategy**: Use Supabase's foreign key relationships for efficient joins.

```typescript
// ✅ GOOD: Nested select with join
.select(`
  conversation_id,
  user_id,
  profiles!conversation_participants_user_id_fkey (
    id,
    name,
    avatar_url
  )
`)
```

### 6. Efficient Counting
**Location**: Query optimization utilities

**Strategy**: Use `count: 'exact'` with `head: true` for efficient counts.

```typescript
// ✅ GOOD: Efficient count
.select('id', { count: 'exact', head: true })

// ❌ BAD: Fetching all records then counting
const { data } = await query;
const count = data?.length;
```

## Available Utilities

### `queryOptimization.ts`

Provides reusable query optimization functions:

1. **`batchFetch()`** - Fetch multiple items in batches
2. **`paginatedFetch()`** - Cursor-based pagination
3. **`batchUpdate()`** - Update multiple records efficiently
4. **`batchDelete()`** - Delete multiple records efficiently
5. **`countRecords()`** - Efficient counting
6. **`fullTextSearch()`** - Full-text search with filters
7. **`joinQuery()`** - Efficient join queries

### Usage Examples

```typescript
import { batchFetch, paginatedFetch, countRecords } from '@/lib/queryOptimization';

// Batch fetch
const users = await batchFetch<Profile>('profiles', userIds, 'id, name, avatar_url');

// Paginated fetch
const { data, nextCursor, hasMore } = await paginatedFetch('posts', {
  selectFields: 'id, content, created_at',
  pageSize: 20,
  orderBy: { field: 'created_at', ascending: false },
  filters: [{ field: 'user_id', operator: 'eq', value: userId }]
});

// Count records
const totalPosts = await countRecords('community_posts', [
  { field: 'user_id', operator: 'eq', value: userId }
]);
```

## Performance Guidelines

### Query Limits
- **Max batch size**: 100 items per query
- **Max page size**: 100 items per page
- **Recommended page size**: 20-50 items

### Best Practices

1. **Always use pagination** for large datasets
2. **Batch operations** when fetching multiple related items
3. **Select only needed fields** to reduce payload
4. **Use indexes** on frequently filtered columns
5. **Cache results** when appropriate
6. **Debounce search queries** to reduce API calls
7. **Use RLS policies** to filter at database level

### Columns to Index (Recommended)

```sql
-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Community Posts
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

-- Conversation Participants
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Friendships
CREATE INDEX idx_friendships_user1_id ON friendships(user1_id);
CREATE INDEX idx_friendships_user2_id ON friendships(user2_id);
```

## Monitoring

### Slow Queries
Monitor Supabase logs for slow queries:
1. Go to Supabase Dashboard
2. Check "Logs" section
3. Look for queries taking > 1000ms

### Optimization Opportunities
- Check query execution plans
- Verify indexes are being used
- Monitor RLS policy performance
- Track API response times

## Future Optimizations

1. **Implement caching layer** (Redis/IndexedDB)
2. **Add query result caching** in stores
3. **Implement request deduplication**
4. **Add GraphQL for complex queries**
5. **Implement real-time subscriptions** more efficiently
6. **Add query result streaming** for large datasets
