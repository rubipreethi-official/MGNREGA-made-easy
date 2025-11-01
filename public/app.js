// Global state
let dashboardData = null;
let currentLanguage = 'English';
let charts = {};
let regionalLanguage = null; // Detected regional language (e.g., 'Tamil')

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 MGNREGA Made Easy - Initializing...');
    await loadDashboard();
});

/**
 * Get user's location using browser Geolocation API
 */
function getBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log('⚠️ Geolocation not supported, using IP-based detection');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                console.log('⚠️ Geolocation error:', error.message);
                console.log('📍 Falling back to IP-based detection');
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    });
}

/**
 * Load dashboard data from API
 */
async function loadDashboard() {
    try {
        // Try to get browser location first
        const browserLocation = await getBrowserLocation();
        
        // Build API URL with coordinates if available
        let apiUrl = '/api/dashboard';
        if (browserLocation) {
            apiUrl += `?lat=${browserLocation.lat}&lon=${browserLocation.lon}`;
            console.log('📍 Using browser geolocation:', browserLocation);
        }

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load data');
        }

        dashboardData = result.data;
        currentLanguage = 'English';

        // Debug: Log what we received
        console.log('📊 Dashboard data received:', {
            detectedLocation: result.detectedLocation,
            detectedLanguages: result.data.summary?.detectedLanguages,
            allData: result.data
        });

        // Update UI with data
        updateDistrictInfo(result.detectedLocation);
        
        // Get detected languages from the correct path
        const detectedLanguages = result.data.summary?.detectedLanguages || 
                                  result.data.detectedLanguages || 
                                  ['English'];
        
        console.log('🌍 Detected languages:', detectedLanguages);
        
        // Make sure detectedLanguages is in the data object for populateLanguageSelector
        if (!result.data.detectedLanguages) {
            result.data.detectedLanguages = detectedLanguages;
        }
        
        populateLanguageSelector(result.data);
        renderCharts(result.data);
        renderStats(result.data);
        updateExplanations(result.data);

        // Show main content
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

        console.log('✅ Dashboard loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div class="loading-content">
                <h2>Error Loading Data</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

/**
 * Update district information display
 */
function updateDistrictInfo(location) {
    const districtInfo = document.getElementById('districtInfo');
    districtInfo.textContent = `📍 ${location.district}, ${location.state}, ${location.country}`;
}

/**
 * Populate language selector dropdown and show regional translate button
 */
function populateLanguageSelector(data) {
    const langSelect = document.getElementById('langSelect');
    const languages = data.detectedLanguages || ['English'];

    // Clear existing options
    langSelect.innerHTML = '';

    // Add all languages
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        langSelect.appendChild(option);
    });

    currentLanguage = langSelect.value;
    
    // Show regional language translate button if regional language detected
    const translateBtn = document.getElementById('translateRegionalBtn');
    const translateBtnText = document.getElementById('translateBtnText');
    
    // Find the first non-English language (regional language)
    const regionalLang = languages.find(lang => lang !== 'English');
    
    if (regionalLang) {
        regionalLanguage = regionalLang;
        if (translateBtn) {
            translateBtn.style.display = 'inline-block';
            translateBtnText.textContent = `Translate to ${regionalLanguage}`;
            console.log(`✅ Regional language button shown for: ${regionalLanguage}`);
        }
    } else {
        regionalLanguage = null;
        if (translateBtn) {
            translateBtn.style.display = 'none';
        }
        console.log('ℹ️ No regional language detected');
    }
}

/**
 * Translate page content on-demand when user selects language
 */
async function translatePageContent(language) {
    if (language === 'English') {
        // Reset to English
        const pageContent = dashboardData.pageContent?.English || {};
        if (pageContent.title) document.querySelector('.logo h1').textContent = `🎯 ${pageContent.title}`;
        if (pageContent.tagline) document.querySelector('.tagline').textContent = pageContent.tagline;
        if (pageContent.welcomeText) document.querySelector('.location-info h2').textContent = pageContent.welcomeText;
        if (pageContent.statsTitle) document.querySelector('.stats-section h2').textContent = `📊 ${pageContent.statsTitle}`;
        if (pageContent.chooseLanguage) document.querySelector('.language-selector label').textContent = `🌐 ${pageContent.chooseLanguage}`;
        
        // Re-render stats
        if (dashboardData) renderStats(dashboardData);
        return;
    }

    // Show loading indicator
    const langSelect = document.getElementById('langSelect');
    const originalDisabled = langSelect.disabled;
    langSelect.disabled = true;
    langSelect.style.opacity = '0.6';

    try {
        const pageContentEn = dashboardData.pageContent?.English || {};
        const textsToTranslate = [
            pageContentEn.title || 'MGNREGA Made Easy',
            pageContentEn.tagline || 'Know Where Your Region Stands',
            pageContentEn.welcomeText || 'Welcome to Your District Dashboard',
            pageContentEn.employmentTitle || 'Employment Status',
            pageContentEn.expenditureTitle || 'Money Spent Analysis',
            pageContentEn.worksTitle || 'Works Progress',
            pageContentEn.trendTitle || 'Employment Trends (Last 12 Months)',
            pageContentEn.statsTitle || 'Key Statistics',
            pageContentEn.chooseLanguage || 'Choose Language:',
            pageContentEn.employmentRateLabel || 'Employment Rate',
            pageContentEn.gotWorkLabel || 'Got Work',
            pageContentEn.totalPeopleLabel || 'Total People Employed',
            pageContentEn.thisMonthLabel || 'This Month',
            pageContentEn.totalMoneyLabel || 'Total Money Spent',
            pageContentEn.totalProjectsLabel || 'Total Projects',
            pageContentEn.ongoingLabel || 'Ongoing',
            pageContentEn.completedProjectsLabel || 'Completed Projects',
            pageContentEn.finishedLabel || 'Finished',
            pageContentEn.averageWageLabel || 'Average Wage',
            pageContentEn.perDayLabel || 'Per Day'
        ];

        // Translate all texts
        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, targetLanguage: language })
        });

        const result = await response.json();
        if (result.success && result.translated && result.translated.length === textsToTranslate.length) {
            const translations = result.translated;
            
            // Update page elements
            const logoH1 = document.querySelector('.logo h1');
            const tagline = document.querySelector('.tagline');
            const welcomeH2 = document.querySelector('.location-info h2');
            const chartTitles = document.querySelectorAll('.chart-card h3');
            const statsH2 = document.querySelector('.stats-section h2');
            const langLabel = document.querySelector('.language-selector label');

            if (logoH1) logoH1.textContent = `🎯 ${translations[0]}`;
            if (tagline) tagline.textContent = translations[1];
            if (welcomeH2) welcomeH2.textContent = translations[2];
            if (chartTitles.length > 0) chartTitles[0].textContent = `👥 ${translations[3]}`;
            if (chartTitles.length > 1) chartTitles[1].textContent = `💰 ${translations[4]}`;
            if (chartTitles.length > 2) chartTitles[2].textContent = `🏗️ ${translations[5]}`;
            if (chartTitles.length > 3) chartTitles[3].textContent = `📈 ${translations[6]}`;
            if (statsH2) statsH2.textContent = `📊 ${translations[7]}`;
            if (langLabel) langLabel.textContent = `🌐 ${translations[8]}`;
            
            // Store translated content for stats
            if (!dashboardData.pageContent) dashboardData.pageContent = {};
            dashboardData.pageContent[language] = {
                title: translations[0],
                tagline: translations[1],
                welcomeText: translations[2],
                employmentTitle: translations[3],
                expenditureTitle: translations[4],
                worksTitle: translations[5],
                trendTitle: translations[6],
                statsTitle: translations[7],
                chooseLanguage: translations[8],
                employmentRateLabel: translations[9],
                gotWorkLabel: translations[10],
                totalPeopleLabel: translations[11],
                thisMonthLabel: translations[12],
                totalMoneyLabel: translations[13],
                totalProjectsLabel: translations[14],
                ongoingLabel: translations[15],
                completedProjectsLabel: translations[16],
                finishedLabel: translations[17],
                averageWageLabel: translations[18],
                perDayLabel: translations[19]
            };
            
            // Re-render stats with translated labels
            renderStats(dashboardData);
            
            console.log(`✅ Page translated to ${language}`);
        } else {
            console.error('Translation failed or incomplete');
        }
    } catch (error) {
        console.error('Error translating page content:', error);
    } finally {
        langSelect.disabled = originalDisabled;
        langSelect.style.opacity = '1';
    }
}

/**
 * Switch language
 */
async function switchLanguage() {
    const langSelect = document.getElementById('langSelect');
    currentLanguage = langSelect.value;
    
    // Translate page content (async, on-demand)
    await translatePageContent(currentLanguage);
    
    // Translate explanations
    if (dashboardData) {
        await translateExplanations(currentLanguage);
    }
}

/**
 * Translate explanations when language is selected
 */
async function translateExplanations(language) {
    if (!dashboardData || !dashboardData.explanations) {
        console.error('❌ No dashboard data or explanations available');
        return;
    }
    
    // If already translated, use it
    if (dashboardData.explanations[language]) {
        console.log(`✅ Using cached translation for ${language}`);
        updateExplanations(dashboardData);
        return;
    }
    
    // Translate explanations on-demand
    try {
        const explanationsEn = dashboardData.explanations.English || {};
        
        if (!explanationsEn.employment && !explanationsEn.expenditure && !explanationsEn.works) {
            console.error('❌ No English explanations found');
            return;
        }
        
        const textsToTranslate = [
            explanationsEn.employment || '',
            explanationsEn.expenditure || '',
            explanationsEn.works || ''
        ];
        
        console.log(`📤 Sending translation request for ${language}:`, textsToTranslate.map(t => t.substring(0, 50) + '...'));
        
        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, targetLanguage: language })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📥 Translation response:', result);
        
        if (result.success && result.translated && result.translated.length === 3) {
            // Store translated explanations
            if (!dashboardData.explanations[language]) {
                dashboardData.explanations[language] = {};
            }
            
            dashboardData.explanations[language] = {
                employment: result.translated[0],
                expenditure: result.translated[1],
                works: result.translated[2]
            };
            
            updateExplanations(dashboardData);
            console.log(`✅ Explanations translated to ${language}`);
        } else {
            throw new Error('Translation response incomplete');
        }
    } catch (error) {
        console.error('❌ Error translating explanations:', error);
        // Fallback to English
        if (dashboardData.explanations.English) {
            updateExplanations(dashboardData);
        }
        throw error; // Re-throw to let caller handle it
    }
}

/**
 * Translate descriptions to regional language (called by button click)
 */
async function translateToRegional() {
    console.log('🔄 Translate to regional button clicked');
    
    if (!regionalLanguage) {
        console.warn('⚠️ No regional language detected');
        alert('Regional language not detected. Please check your location.');
        return;
    }
    
    const translateBtn = document.getElementById('translateRegionalBtn');
    const translateBtnText = document.getElementById('translateBtnText');
    
    if (!translateBtn || !translateBtnText) {
        console.error('❌ Translate button elements not found');
        return;
    }
    
    // Disable button and show loading
    const originalText = translateBtnText.textContent;
    translateBtn.disabled = true;
    translateBtnText.textContent = 'Translating...';
    translateBtn.style.opacity = '0.7';
    
    try {
        console.log(`🌍 Translating descriptions to ${regionalLanguage}...`);
        
        // Translate explanations/descriptions only
        await translateExplanations(regionalLanguage);
        
        // Update button text to show it's translated
        translateBtnText.textContent = `✓ Translated to ${regionalLanguage}`;
        translateBtn.style.background = '#27ae60';
        translateBtn.disabled = false;
        translateBtn.style.opacity = '1';
        
        console.log(`✅ Descriptions translated to ${regionalLanguage}`);
        
        // Keep the success message for 3 seconds, then reset
        setTimeout(() => {
            translateBtnText.textContent = originalText;
            translateBtn.style.background = '';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error translating to regional language:', error);
        translateBtn.disabled = false;
        translateBtnText.textContent = originalText;
        translateBtn.style.opacity = '1';
        translateBtn.style.background = '';
        alert(`Translation failed: ${error.message}. Please try again.`);
    }
}

/**
 * Render all charts
 */
function renderCharts(data) {
    renderEmploymentChart(data.summary);
    renderExpenditureChart(data.summary);
    renderWorksChart(data.summary);
    renderTrendChart(data.historical);
}

/**
 * Employment Pie Chart
 */
function renderEmploymentChart(summary) {
    const ctx = document.getElementById('employmentChart').getContext('2d');

    if (charts.employment) {
        charts.employment.destroy();
    }

    charts.employment = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Got Work', 'Didn\'t Get Work'],
            datasets: [{
                data: [
                    summary.employment.personsEmployed,
                    summary.employment.personsDemanded - summary.employment.personsEmployed
                ],
                backgroundColor: [
                    '#2ecc71',
                    '#e74c3c'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Expenditure Pie Chart
 */
function renderExpenditureChart(summary) {
    const ctx = document.getElementById('expenditureChart').getContext('2d');

    if (charts.expenditure) {
        charts.expenditure.destroy();
    }

    const total = summary.expenditure.total;
    const wagesPercent = ((summary.expenditure.wages / total) * 100).toFixed(1);
    const materialPercent = ((summary.expenditure.material / total) * 100).toFixed(1);
    const adminPercent = ((summary.expenditure.admin / total) * 100).toFixed(1);

    charts.expenditure = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Wages Paid', 'Material Cost', 'Administration'],
            datasets: [{
                data: [
                    summary.expenditure.wages,
                    summary.expenditure.material,
                    summary.expenditure.admin
                ],
                backgroundColor: [
                    '#3498db',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Works Progress Pie Chart
 */
function renderWorksChart(summary) {
    const ctx = document.getElementById('worksChart').getContext('2d');

    if (charts.works) {
        charts.works.destroy();
    }

    charts.works = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed Works', 'In Progress Works', 'Not Started'],
            datasets: [{
                data: [
                    summary.works.completed,
                    summary.works.inProgress,
                    summary.works.total - summary.works.completed - summary.works.inProgress
                ],
                backgroundColor: [
                    '#27ae60',
                    '#f39c12',
                    '#95a5a6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Employment Trend Line Chart
 */
function renderTrendChart(historical) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (charts.trend) {
        charts.trend.destroy();
    }

    const labels = historical.map(h => {
        const date = new Date(h.month + '-01');
        return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Persons Demanded Work',
                    data: historical.map(h => h.employment.demanded),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Persons Got Work',
                    data: historical.map(h => h.employment.employed),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render statistics cards
 */
function renderStats(data) {
    const statsGrid = document.getElementById('statsGrid');
    const summary = data.summary;
    
    // Get labels in current language
    const pageContent = (data.pageContent && data.pageContent[currentLanguage]) || 
                        (data.pageContent && data.pageContent['English']) || {};
    
    const labels = {
        employmentRate: pageContent.employmentRateLabel || 'Employment Rate',
        gotWork: pageContent.gotWorkLabel || 'Got Work',
        totalPeople: pageContent.totalPeopleLabel || 'Total People Employed',
        thisMonth: pageContent.thisMonthLabel || 'This Month',
        totalMoney: pageContent.totalMoneyLabel || 'Total Money Spent',
        totalProjects: pageContent.totalProjectsLabel || 'Total Projects',
        ongoing: pageContent.ongoingLabel || 'Ongoing',
        completedProjects: pageContent.completedProjectsLabel || 'Completed Projects',
        finished: pageContent.finishedLabel || 'Finished',
        averageWage: pageContent.averageWageLabel || 'Average Wage',
        perDay: pageContent.perDayLabel || 'Per Day'
    };

    statsGrid.innerHTML = `
        <div class="stat-card">
            <h4>${labels.employmentRate}</h4>
            <div class="stat-value">${summary.employment.employmentRate}%</div>
            <div class="stat-unit">${labels.gotWork}</div>
        </div>
        <div class="stat-card">
            <h4>${labels.totalPeople}</h4>
            <div class="stat-value">${summary.employment.personsEmployed.toLocaleString()}</div>
            <div class="stat-unit">${labels.thisMonth}</div>
        </div>
        <div class="stat-card">
            <h4>${labels.totalMoney}</h4>
            <div class="stat-value">₹${(summary.expenditure.total / 10000000).toFixed(2)}Cr</div>
            <div class="stat-unit">${labels.thisMonth}</div>
        </div>
        <div class="stat-card">
            <h4>${labels.totalProjects}</h4>
            <div class="stat-value">${summary.works.total}</div>
            <div class="stat-unit">${labels.ongoing}</div>
        </div>
        <div class="stat-card">
            <h4>${labels.completedProjects}</h4>
            <div class="stat-value">${summary.works.completed}</div>
            <div class="stat-unit">${labels.finished}</div>
        </div>
        <div class="stat-card">
            <h4>${labels.averageWage}</h4>
            <div class="stat-value">₹200</div>
            <div class="stat-unit">${labels.perDay}</div>
        </div>
    `;
}

/**
 * Update explanations based on current language
 */
function updateExplanations(data) {
    const explanations = data.explanations[currentLanguage] || data.explanations['English'];

    document.getElementById('employmentExplanation').textContent = explanations.employment;
    document.getElementById('expenditureExplanation').textContent = explanations.expenditure;
    document.getElementById('worksExplanation').textContent = explanations.works;
}

// Export for debugging
window.dashboardDebug = {
    data: () => dashboardData,
    language: () => currentLanguage,
    charts: () => charts
};

