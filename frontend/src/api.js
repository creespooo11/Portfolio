async function get(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
    return response.json();
}
export const portfolioApi = {
    projects: () => get('/api/projects'),
    skills: () => get('/api/skills'),
    experience: () => get('/api/experience'),
};
