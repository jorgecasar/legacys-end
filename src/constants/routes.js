export const ROUTES = {
	HUB: "/",
	QUEST: (id) => `/quest/${id}`,
	CHAPTER: (questId, chapterId) => `/quest/${questId}/chapter/${chapterId}`,
};
