export async function deleteArticle(client, table, id) {
  if (!['posts','stories'].includes(table)||!id) throw new Error('Bài viết không hợp lệ.');
  const {data,error}=await client.from(table).delete().eq('id',id).select('id').single();
  if(error) throw error;
  if(!data||data.id!==id) throw new Error('Database chưa xác nhận xóa bài viết.');
  return data.id;
}
