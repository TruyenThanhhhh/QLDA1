import localforage from 'localforage';

// Cấu hình localforage để tạo một store riêng cho việc lưu nháp các form báo cáo
const draftStore = localforage.createInstance({
  name: 'QLDA_Offline',
  storeName: 'draft_reports',
});

export const saveDraftReport = async (data) => {
  try {
    const id = data.id || `draft_${Date.now()}`;
    await draftStore.setItem(id, { ...data, isDraft: true, savedAt: Date.now() });
    return id;
  } catch (err) {
    console.error('Lỗi khi lưu nháp:', err);
    throw err;
  }
};

export const getDraftReports = async () => {
  try {
    const drafts = [];
    await draftStore.iterate((value, key) => {
      drafts.push({ ...value, id: key });
    });
    return drafts.sort((a, b) => b.savedAt - a.savedAt);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách nháp:', err);
    return [];
  }
};

export const deleteDraftReport = async (id) => {
  try {
    await draftStore.removeItem(id);
  } catch (err) {
    console.error('Lỗi khi xoá bản nháp:', err);
    throw err;
  }
};

export const clearAllDrafts = async () => {
  try {
    await draftStore.clear();
  } catch (err) {
    console.error('Lỗi khi xoá toàn bộ bản nháp:', err);
    throw err;
  }
};
