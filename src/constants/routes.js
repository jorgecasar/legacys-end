export const ROUTES = {
	HUB: "/",
	/** @param {string} id */
	QUEST: (id) => `/quest/${id}`,
	/**
	 * @param {string} questId
	 * @param {string} chapterId
	 */
	CHAPTER: (questId, chapterId) => `/quest/${questId}/chapter/${chapterId}`,
};
