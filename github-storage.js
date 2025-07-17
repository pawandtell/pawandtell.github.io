// GitHub Storage Implementation
// This uses GitHub's API to store feedback data in repository files

class GitHubStorage {
    constructor() {
        // GitHub repository details
        this.owner = 'pawandtell';
        this.repo = 'pawandtell.github.io';
        this.branch = 'main';
        this.dataPath = 'data/feedback.json';
        
        // GitHub API base URL
        this.apiBase = 'https://api.github.com';
        
        // You'll need a GitHub Personal Access Token for write operations
        // For read-only operations, no token is needed
        this.token = null; // Set this if you want write operations
    }

    async loadFeedback() {
        try {
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`;
            const response = await fetch(url);
            
            if (response.status === 404) {
                // File doesn't exist yet, return empty array
                return [];
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const data = await response.json();
            const content = atob(data.content); // Decode base64
            return JSON.parse(content);
        } catch (error) {
            console.warn('Failed to load from GitHub:', error);
            return [];
        }
    }

    async saveFeedback(feedbackArray) {
        if (!this.token) {
            throw new Error('GitHub token required for saving data');
        }

        try {
            // First, get the current file to get its SHA (required for updates)
            const currentFile = await this.getCurrentFile();
            
            // Prepare the new content
            const content = btoa(JSON.stringify(feedbackArray, null, 2)); // Encode to base64
            
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`;
            
            const body = {
                message: `Update feedback data - ${new Date().toISOString()}`,
                content: content,
                branch: this.branch
            };
            
            // If file exists, include SHA for update
            if (currentFile) {
                body.sha = currentFile.sha;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save to GitHub:', error);
            throw error;
        }
    }

    async getCurrentFile() {
        try {
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`;
            const response = await fetch(url);
            
            if (response.status === 404) {
                return null; // File doesn't exist
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('Failed to get current file:', error);
            return null;
        }
    }

    // Alternative: Use GitHub Issues as database
    async saveAsIssue(feedbackData) {
        if (!this.token) {
            throw new Error('GitHub token required for creating issues');
        }

        try {
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
            
            const issueBody = this.formatFeedbackAsIssue(feedbackData);
            
            const body = {
                title: `Feedback: ${feedbackData.rescueName} - ${feedbackData.ratings.overall}★`,
                body: issueBody,
                labels: ['feedback', `rating-${feedbackData.ratings.overall}`, feedbackData.volunteerType || 'general']
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to create GitHub issue:', error);
            throw error;
        }
    }

    async loadFromIssues() {
        try {
            const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues?labels=feedback&state=open&sort=created&direction=desc`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const issues = await response.json();
            return issues.map(issue => this.parseIssueToFeedback(issue));
        } catch (error) {
            console.warn('Failed to load from GitHub issues:', error);
            return [];
        }
    }

    formatFeedbackAsIssue(feedback) {
        const stars = '★'.repeat(feedback.ratings.overall) + '☆'.repeat(5 - feedback.ratings.overall);
        
        return `
## Volunteer Feedback

**Rescue:** ${feedback.rescueName}
**Volunteer:** ${feedback.volunteerName}
**Activity:** ${feedback.volunteerType || 'Not specified'}
**Overall Rating:** ${stars} (${feedback.ratings.overall}/5)

### Detailed Ratings
- **Organization & Communication:** ${'★'.repeat(feedback.ratings.organization || 0)}${'☆'.repeat(5 - (feedback.ratings.organization || 0))}
- **Staff Support & Training:** ${'★'.repeat(feedback.ratings.support || 0)}${'☆'.repeat(5 - (feedback.ratings.support || 0))}
- **Facility Conditions:** ${'★'.repeat(feedback.ratings.facility || 0)}${'☆'.repeat(5 - (feedback.ratings.facility || 0))}

### Feedback
${feedback.feedback}

**Recommends to others:** ${feedback.recommend ? 'Yes ✓' : 'No'}

---
*Submitted: ${new Date(feedback.timestamp).toLocaleString()}*
${feedback.email ? `*Contact: ${feedback.email}*` : ''}
        `.trim();
    }

    parseIssueToFeedback(issue) {
        // Extract data from issue title and body
        const titleMatch = issue.title.match(/Feedback: (.+) - (\d)★/);
        const rescueName = titleMatch ? titleMatch[1] : 'Unknown';
        const overallRating = titleMatch ? parseInt(titleMatch[2]) : 0;
        
        // Parse body for more details (simplified parsing)
        const body = issue.body || '';
        const volunteerMatch = body.match(/\*\*Volunteer:\*\* (.+)/);
        const activityMatch = body.match(/\*\*Activity:\*\* (.+)/);
        const feedbackMatch = body.match(/### Feedback\n(.+?)\n\n/s);
        const recommendMatch = body.match(/\*\*Recommends to others:\*\* (Yes|No)/);
        
        return {
            rescueName: rescueName,
            volunteerName: volunteerMatch ? volunteerMatch[1] : 'Anonymous',
            volunteerType: activityMatch ? activityMatch[1] : '',
            ratings: {
                overall: overallRating,
                organization: 0, // Could parse these too
                support: 0,
                facility: 0
            },
            feedback: feedbackMatch ? feedbackMatch[1].trim() : '',
            recommend: recommendMatch ? recommendMatch[1] === 'Yes' : false,
            timestamp: issue.created_at,
            githubIssue: issue.number
        };
    }
}

export default GitHubStorage;