class VolunteerFeedbackApp {
    constructor() {
        this.feedbackData = JSON.parse(localStorage.getItem('volunteerFeedback')) || [];
        this.ratings = {
            overall: 0,
            organization: 0,
            support: 0,
            facility: 0
        };
        this.currentTab = 'submit';
        this.filteredResults = [];

        this.initializeEventListeners();
        this.displayFeedback();
        this.initializeSearch();
    }

    initializeEventListeners() {
        // Star rating functionality
        document.querySelectorAll('.rating-stars').forEach(ratingGroup => {
            const stars = ratingGroup.querySelectorAll('.star');

            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.setRating(ratingGroup, index + 1);
                });

                star.addEventListener('mouseenter', () => {
                    this.highlightStars(ratingGroup, index + 1);
                });
            });

            ratingGroup.addEventListener('mouseleave', () => {
                this.resetStarHighlight(ratingGroup);
            });
        });

        // Form submission
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });

        // Tab functionality
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    setRating(ratingGroup, rating) {
        const category = ratingGroup.id || ratingGroup.dataset.category;

        // Handle the overall rating specifically
        if (ratingGroup.id === 'overallRating') {
            this.ratings.overall = rating;
        } else {
            this.ratings[category] = rating;
        }

        const stars = ratingGroup.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    highlightStars(ratingGroup, rating) {
        const stars = ratingGroup.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.style.color = index < rating ? '#ffc107' : '#ddd';
        });
    }

    resetStarHighlight(ratingGroup) {
        let currentRating = 0;

        if (ratingGroup.id === 'overallRating') {
            currentRating = this.ratings.overall || 0;
        } else {
            const category = ratingGroup.dataset.category;
            currentRating = this.ratings[category] || 0;
        }

        const stars = ratingGroup.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.style.color = index < currentRating ? '#ffc107' : '#ddd';
        });
    }

    submitFeedback() {
        const formData = {
            rescueName: document.getElementById('rescueName').value,
            volunteerName: document.getElementById('volunteerName').value,
            email: document.getElementById('email').value,
            volunteerType: document.getElementById('volunteerType').value,
            ratings: { ...this.ratings },
            feedback: document.getElementById('feedback').value,
            recommend: document.getElementById('recommend').checked,
            timestamp: new Date().toISOString()
        };

        // Validation
        if (!formData.rescueName || !formData.volunteerName || !formData.feedback) {
            alert('Please fill in all required fields.');
            return;
        }

        if (formData.ratings.overall === 0) {
            alert('Please provide an overall rating.');
            return;
        }

        // Save feedback
        this.feedbackData.unshift(formData);
        localStorage.setItem('volunteerFeedback', JSON.stringify(this.feedbackData));

        // Reset form
        this.resetForm();

        // Update display
        this.displayFeedback();

        // Show success message
        this.showSuccessMessage();
    }

    resetForm() {
        document.getElementById('feedbackForm').reset();
        this.ratings = {
            overall: 0,
            organization: 0,
            support: 0,
            facility: 0
        };

        // Reset all star ratings
        document.querySelectorAll('.star').forEach(star => {
            star.classList.remove('active');
            star.style.color = '#ddd';
        });
    }

    displayFeedback() {
        const feedbackList = document.getElementById('feedbackList');

        if (this.feedbackData.length === 0) {
            feedbackList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No feedback submitted yet. Be the first to share your experience!</p>';
            return;
        }

        feedbackList.innerHTML = this.feedbackData.map(feedback => this.createFeedbackHTML(feedback)).join('');
    }

    createFeedbackHTML(feedback) {
        const date = new Date(feedback.timestamp).toLocaleDateString();
        const overallStars = '★'.repeat(feedback.ratings.overall) + '☆'.repeat(5 - feedback.ratings.overall);

        return `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div class="rescue-name">${this.escapeHtml(feedback.rescueName)}</div>
                    <div class="rating-display">${overallStars}</div>
                </div>
                
                <div class="volunteer-info">
                    <strong>${this.escapeHtml(feedback.volunteerName)}</strong>
                    ${feedback.volunteerType ? ` • ${this.getVolunteerTypeLabel(feedback.volunteerType)}` : ''}
                </div>
                
                <div class="feedback-text">
                    "${this.escapeHtml(feedback.feedback)}"
                </div>
                
                <div class="detailed-ratings">
                    <div class="detailed-rating">
                        <span>Organization:</span>
                        <span>${'★'.repeat(feedback.ratings.organization || 0)}${'☆'.repeat(5 - (feedback.ratings.organization || 0))}</span>
                    </div>
                    <div class="detailed-rating">
                        <span>Staff Support:</span>
                        <span>${'★'.repeat(feedback.ratings.support || 0)}${'☆'.repeat(5 - (feedback.ratings.support || 0))}</span>
                    </div>
                    <div class="detailed-rating">
                        <span>Facility:</span>
                        <span>${'★'.repeat(feedback.ratings.facility || 0)}${'☆'.repeat(5 - (feedback.ratings.facility || 0))}</span>
                    </div>
                </div>
                
                ${feedback.recommend ? '<div class="recommend-badge">✓ Recommends to others</div>' : ''}
                
                <div class="timestamp">${date}</div>
            </div>
        `;
    }

    getVolunteerTypeLabel(type) {
        const labels = {
            'animal-care': 'Animal Care',
            'dog-walking': 'Dog Walking',
            'cat-socialization': 'Cat Socialization',
            'cleaning': 'Cleaning & Maintenance',
            'events': 'Events & Fundraising',
            'transport': 'Animal Transport',
            'admin': 'Administrative',
            'other': 'Other'
        };
        return labels[type] || type;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            font-weight: 600;
        `;
        message.textContent = 'Feedback submitted successfully! Thank you for sharing your experience.';

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 4000);
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.getElementById(`${tabName}-tab`).classList.add('active');

        // If switching to search tab, perform initial search
        if (tabName === 'search') {
            this.performSearch();
        }
    }

    initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearButton = document.getElementById('clearSearch');
        const ratingFilter = document.getElementById('ratingFilter');
        const activityFilter = document.getElementById('activityFilter');

        // Search input with debounce
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.performSearch(), 300);
        });

        // Clear search
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            ratingFilter.value = '';
            activityFilter.value = '';
            this.performSearch();
        });

        // Filter changes
        ratingFilter.addEventListener('change', () => this.performSearch());
        activityFilter.addEventListener('change', () => this.performSearch());
    }

    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const ratingFilter = document.getElementById('ratingFilter').value;
        const activityFilter = document.getElementById('activityFilter').value;

        this.filteredResults = this.feedbackData.filter(feedback => {
            // Search by rescue name
            const matchesSearch = !searchTerm ||
                feedback.rescueName.toLowerCase().includes(searchTerm);

            // Filter by rating
            const matchesRating = !ratingFilter ||
                feedback.ratings.overall >= parseInt(ratingFilter);

            // Filter by activity
            const matchesActivity = !activityFilter ||
                feedback.volunteerType === activityFilter;

            return matchesSearch && matchesRating && matchesActivity;
        });

        this.displaySearchResults();
        this.updateSearchStats();
    }

    displaySearchResults() {
        const searchResults = document.getElementById('searchResults');

        if (this.filteredResults.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No reviews found matching your search criteria.</div>';
            return;
        }

        // Group results by rescue name
        const groupedResults = this.groupByRescue(this.filteredResults);

        searchResults.innerHTML = Object.entries(groupedResults)
            .map(([rescueName, reviews]) => this.createRescueSummaryHTML(rescueName, reviews))
            .join('');
    }

    groupByRescue(feedback) {
        return feedback.reduce((groups, item) => {
            const rescueName = item.rescueName;
            if (!groups[rescueName]) {
                groups[rescueName] = [];
            }
            groups[rescueName].push(item);
            return groups;
        }, {});
    }

    createRescueSummaryHTML(rescueName, reviews) {
        const avgRating = reviews.reduce((sum, review) => sum + review.ratings.overall, 0) / reviews.length;
        const recommendCount = reviews.filter(review => review.recommend).length;
        const recommendPercent = Math.round((recommendCount / reviews.length) * 100);

        return `
            <div class="rescue-summary">
                <h3>${this.escapeHtml(rescueName)}</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${avgRating.toFixed(1)}</div>
                        <div class="stat-label">Avg Rating</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reviews.length}</div>
                        <div class="stat-label">Reviews</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${recommendPercent}%</div>
                        <div class="stat-label">Recommend</div>
                    </div>
                </div>
            </div>
            ${reviews.map(review => this.createFeedbackHTML(review)).join('')}
        `;
    }

    updateSearchStats() {
        const searchStats = document.getElementById('searchStats');
        const totalReviews = this.feedbackData.length;
        const filteredCount = this.filteredResults.length;

        if (totalReviews === 0) {
            searchStats.innerHTML = 'No reviews available yet.';
        } else if (filteredCount === totalReviews) {
            searchStats.innerHTML = `Showing all ${totalReviews} reviews`;
        } else {
            searchStats.innerHTML = `Showing ${filteredCount} of ${totalReviews} reviews`;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VolunteerFeedbackApp();
});