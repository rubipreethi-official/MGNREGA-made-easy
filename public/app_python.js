let dashboardData = null;
let currentLanguage = 'English';
let regionalLanguage = null;

// Speech synthesis state
const SpeechState = {
  speaking: false,
  currentUtterance: null
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 MGNREGA Made Easy - Initializing with Python charts...');
    await loadDashboard();
});

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
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

async function loadDashboard() {
    try {
        const browserLocation = await getBrowserLocation();
        
        let apiUrl = '/api/dashboard';
        if (browserLocation) {
            apiUrl += `?lat=${browserLocation.lat}&lon=${browserLocation.lon}`;
        }

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load data');
        }

        dashboardData = result.data;
        currentLanguage = 'English';

        updateDistrictInfo(result.detectedLocation);

        const detectedLanguages = result.data.summary?.detectedLanguages || 
                                  result.data.detectedLanguages || 
                                  ['English'];
        
        if (!result.data.detectedLanguages) {
            result.data.detectedLanguages = detectedLanguages;
        }
        
        populateLanguageSelector(result.data);
        
        // Display Python-generated charts
        if (result.data.charts) {
            displayPythonCharts(result.data.charts);
        }
        
        renderStats(result.data);
        updateExplanations(result.data);

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

function displayPythonCharts(charts) {
    console.log('🐍 Displaying Python-generated pie charts...');
    
    if (!charts) {
        console.warn('⚠️ No charts data received');
        return;
    }
    
    if (charts.employment) {
        try {
            const employmentImg = document.getElementById('employmentChart');
            if (employmentImg) {
                employmentImg.src = `data:image/png;base64,${charts.employment}`;
                employmentImg.style.display = 'block';
                console.log('✅ Employment chart displayed');
            }
        } catch (error) {
            console.error('❌ Error displaying employment chart:', error);
        }
    } else {
        console.warn('⚠️ Employment chart not available');
    }
    
    if (charts.expenditure) {
        try {
            const expenditureImg = document.getElementById('expenditureChart');
            if (expenditureImg) {
                expenditureImg.src = `data:image/png;base64,${charts.expenditure}`;
                expenditureImg.style.display = 'block';
                console.log('✅ Expenditure chart displayed');
            }
        } catch (error) {
            console.error('❌ Error displaying expenditure chart:', error);
        }
    } else {
        console.warn('⚠️ Expenditure chart not available');
    }
    
    if (charts.works) {
        try {
            const worksImg = document.getElementById('worksChart');
            if (worksImg) {
                worksImg.src = `data:image/png;base64,${charts.works}`;
                worksImg.style.display = 'block';
                console.log('✅ Works chart displayed');
            }
        } catch (error) {
            console.error('❌ Error displaying works chart:', error);
        }
    } else {
        console.warn('⚠️ Works chart not available');
    }
}

function updateDistrictInfo(location) {
    const districtInfo = document.getElementById('districtInfo');
    districtInfo.textContent = `📍 ${location.district}, ${location.state}, ${location.country}`;
}

function populateLanguageSelector(data) {
    const langSelect = document.getElementById('langSelect');
    const languages = data.detectedLanguages || ['English'];

    langSelect.innerHTML = '';
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        langSelect.appendChild(option);
    });

    currentLanguage = langSelect.value;
    
    const translateBtn = document.getElementById('translateRegionalBtn');
    const translateBtnText = document.getElementById('translateBtnText');
    const regionalLang = languages.find(lang => lang !== 'English');
    
    if (regionalLang) {
        regionalLanguage = regionalLang;
        if (translateBtn) {
            translateBtn.style.display = 'inline-block';
            translateBtnText.textContent = `Translate to ${regionalLanguage}`;
        }
    } else {
        regionalLanguage = null;
        if (translateBtn) {
            translateBtn.style.display = 'none';
        }
    }
}

function renderStats(data) {
    const statsGrid = document.getElementById('statsGrid');
    const summary = data.summary;
    
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

function updateExplanations(data) {
    const explanations = data.explanations[currentLanguage] || data.explanations['English'];
    document.getElementById('employmentExplanation').textContent = explanations.employment;
    document.getElementById('expenditureExplanation').textContent = explanations.expenditure;
    document.getElementById('worksExplanation').textContent = explanations.works;
}

async function switchLanguage() {
    const langSelect = document.getElementById('langSelect');
    currentLanguage = langSelect.value;
    
    if (dashboardData) {
        await translateExplanations(currentLanguage);
    }
}

async function translateExplanations(language) {
    if (!dashboardData || !dashboardData.explanations) return;
    
    if (dashboardData.explanations[language]) {
        updateExplanations(dashboardData);
        return;
    }
    
    try {
        const explanationsEn = dashboardData.explanations.English || {};
        const textsToTranslate = [
            explanationsEn.employment || '',
            explanationsEn.expenditure || '',
            explanationsEn.works || ''
        ];
        
        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, targetLanguage: language })
        });
        
        const result = await response.json();
        
        if (result.success && result.translated) {
            dashboardData.explanations[language] = {
                employment: result.translated[0],
                expenditure: result.translated[1],
                works: result.translated[2]
            };
            updateExplanations(dashboardData);
        }
    } catch (error) {
        console.error('❌ Error translating explanations:', error);
    }
}

async function translateToRegional() {
    if (!regionalLanguage) {
        alert('Regional language not detected');
        return;
    }
    
    const translateBtn = document.getElementById('translateRegionalBtn');
    const translateBtnText = document.getElementById('translateBtnText');
    
    const originalText = translateBtnText.textContent;
    translateBtn.disabled = true;
    translateBtnText.textContent = 'Translating...';
    translateBtn.style.opacity = '0.6';
    
    try {
        console.log(`🌍 Translating entire page to ${regionalLanguage}...`);
        
        // 1. Translate page content (titles, headers, labels)
        await translatePageContent(regionalLanguage);
        
        // 2. Translate explanations
        await translateExplanations(regionalLanguage);
        
        // Success feedback
        translateBtnText.textContent = `✓ Translated to ${regionalLanguage}`;
        translateBtn.style.background = '#27ae60';
        translateBtn.style.opacity = '1';
        
        setTimeout(() => {
            translateBtnText.textContent = originalText;
            translateBtn.style.background = '';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Translation failed:', error);
        translateBtn.disabled = false;
        translateBtnText.textContent = originalText;
        translateBtn.style.opacity = '1';
        alert(`Translation failed: ${error.message}`);
    }
}

async function translatePageContent(language) {
    if (language === 'English') {
        // Reset to English
        document.querySelector('.logo h1').textContent = '🎯 MGNREGA Made Easy';
        document.querySelector('.tagline').textContent = 'Know Where Your Region Stands';
        document.querySelector('.location-info h2').textContent = 'Welcome to Your District Dashboard';
        document.querySelector('.stats-section h2').textContent = '📊 Key Statistics';
        document.querySelector('.language-selector label').textContent = '🌐 Choose Language:';
        
        // Chart titles
        const chartTitles = document.querySelectorAll('.chart-card h3');
        if (chartTitles[0]) chartTitles[0].textContent = '👥 Employment Status';
        if (chartTitles[1]) chartTitles[1].textContent = '💰 Money Spent Analysis';
        if (chartTitles[2]) chartTitles[2].textContent = '🏗️ Works Progress';
        
        return;
    }

    try {
        // Collect all texts to translate
        const textsToTranslate = [
            'MGNREGA Made Easy',
            'Know Where Your Region Stands',
            'Welcome to Your District Dashboard',
            'Employment Status',
            'Money Spent Analysis',
            'Works Progress',
            'Key Statistics',
            'Choose Language:',
            'Employment Rate',
            'Got Work',
            'Total People Employed',
            'This Month',
            'Total Money Spent',
            'Total Projects',
            'Ongoing',
            'Completed Projects',
            'Finished',
            'Average Wage',
            'Per Day'
        ];

        console.log(`📤 Translating ${textsToTranslate.length} texts to ${language}...`);

        const response = await fetch('/api/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                texts: textsToTranslate, 
                targetLanguage: language 
            })
        });

        if (!response.ok) {
            throw new Error(`Translation API failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.translated && result.translated.length === textsToTranslate.length) {
            const translations = result.translated;
            
            // Apply translations to page elements
            document.querySelector('.logo h1').textContent = `🎯 ${translations[0]}`;
            document.querySelector('.tagline').textContent = translations[1];
            document.querySelector('.location-info h2').textContent = translations[2];
            
            // Chart titles
            const chartTitles = document.querySelectorAll('.chart-card h3');
            if (chartTitles[0]) chartTitles[0].textContent = `👥 ${translations[3]}`;
            if (chartTitles[1]) chartTitles[1].textContent = `💰 ${translations[4]}`;
            if (chartTitles[2]) chartTitles[2].textContent = `🏗️ ${translations[5]}`;
            
            document.querySelector('.stats-section h2').textContent = `📊 ${translations[6]}`;
            document.querySelector('.language-selector label').textContent = `🌐 ${translations[7]}`;
            
            // Update stats with translated labels
            if (dashboardData) {
                const summary = dashboardData.summary;
                const statsGrid = document.getElementById('statsGrid');
                
                statsGrid.innerHTML = `
                    <div class="stat-card">
                        <h4>${translations[8]}</h4>
                        <div class="stat-value">${summary.employment.employmentRate}%</div>
                        <div class="stat-unit">${translations[9]}</div>
                    </div>
                    <div class="stat-card">
                        <h4>${translations[10]}</h4>
                        <div class="stat-value">${summary.employment.personsEmployed.toLocaleString()}</div>
                        <div class="stat-unit">${translations[11]}</div>
                    </div>
                    <div class="stat-card">
                        <h4>${translations[12]}</h4>
                        <div class="stat-value">₹${(summary.expenditure.total / 10000000).toFixed(2)}Cr</div>
                        <div class="stat-unit">${translations[11]}</div>
                    </div>
                    <div class="stat-card">
                        <h4>${translations[13]}</h4>
                        <div class="stat-value">${summary.works.total}</div>
                        <div class="stat-unit">${translations[14]}</div>
                    </div>
                    <div class="stat-card">
                        <h4>${translations[15]}</h4>
                        <div class="stat-value">${summary.works.completed}</div>
                        <div class="stat-unit">${translations[16]}</div>
                    </div>
                    <div class="stat-card">
                        <h4>${translations[17]}</h4>
                        <div class="stat-value">₹200</div>
                        <div class="stat-unit">${translations[18]}</div>
                    </div>
                `;
            }
            
            console.log(`✅ Page content translated to ${language}`);
        } else {
            throw new Error('Translation response incomplete');
        }
    } catch (error) {
        console.error('❌ Page translation error:', error);
        throw error;
    }
}

// ==================== TEXT-TO-SPEECH FUNCTIONALITY ====================

function getVoiceForLanguage(language) {
    const voices = window.speechSynthesis.getVoices();
    
    const languageCodeMap = {
        'Tamil': 'ta-IN',
        'Hindi': 'hi-IN',
        'Telugu': 'te-IN',
        'Marathi': 'mr-IN',
        'Bengali': 'bn-IN',
        'Gujarati': 'gu-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Punjabi': 'pa-IN',
        'Odia': 'or-IN',
        'Assamese': 'as-IN',
        'Urdu': 'ur-IN',
        'English': 'en-IN'
    };

    const langCode = languageCodeMap[language] || 'en-IN';
    let voice = voices.find(v => v.lang === langCode);
    
    if (!voice) {
        voice = voices.find(v => v.lang.startsWith('en'));
    }
    
    return voice;
}

function speakExplanation(chartType) {
    if (!dashboardData || !dashboardData.explanations) {
        alert('Please wait for data to load first.');
        return;
    }

    // Find the button that was clicked
    const buttons = document.querySelectorAll('.speak-btn');
    let activeButton = null;
    
    buttons.forEach(btn => {
        const container = btn.closest('.chart-explanation-container');
        const explanationDiv = container.querySelector('.chart-explanation');
        if (explanationDiv.id.includes(chartType)) {
            activeButton = btn;
        }
    });

    // If already speaking, stop
    if (SpeechState.speaking) {
        window.speechSynthesis.cancel();
        SpeechState.speaking = false;
        if (activeButton) {
            activeButton.classList.remove('speaking');
            activeButton.querySelector('.speak-icon').textContent = '🔊';
            activeButton.querySelector('.speak-text').textContent = 'Listen';
        }
        return;
    }

    const explanations = dashboardData.explanations[currentLanguage] || 
                       dashboardData.explanations['English'];
    
    let text = '';
    switch(chartType) {
        case 'employment':
            text = explanations.employment;
            break;
        case 'expenditure':
            text = explanations.expenditure;
            break;
        case 'works':
            text = explanations.works;
            break;
        default:
            text = 'No explanation available.';
    }

    if (!text) {
        alert('Explanation not available yet. Please select a language first.');
        return;
    }

    // Update button state
    if (activeButton) {
        activeButton.classList.add('speaking');
        activeButton.querySelector('.speak-icon').textContent = '⏸️';
        activeButton.querySelector('.speak-text').textContent = 'Stop';
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice based on language
    const voice = getVoiceForLanguage(currentLanguage);
    if (voice) {
        utterance.voice = voice;
    }
    
    // Set language code
    const languageCodeMap = {
        'Tamil': 'ta-IN',
        'Hindi': 'hi-IN',
        'Telugu': 'te-IN',
        'Marathi': 'mr-IN',
        'Bengali': 'bn-IN',
        'Gujarati': 'gu-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Punjabi': 'pa-IN',
        'Odia': 'or-IN',
        'Assamese': 'as-IN',
        'Urdu': 'ur-IN',
        'English': 'en-IN'
    };
    utterance.lang = languageCodeMap[currentLanguage] || 'en-IN';
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
        SpeechState.speaking = true;
        SpeechState.currentUtterance = utterance;
        console.log(`🔊 Speaking in ${currentLanguage}...`);
    };

    utterance.onend = () => {
        SpeechState.speaking = false;
        SpeechState.currentUtterance = null;
        if (activeButton) {
            activeButton.classList.remove('speaking');
            activeButton.querySelector('.speak-icon').textContent = '🔊';
            activeButton.querySelector('.speak-text').textContent = 'Listen';
        }
        console.log('✅ Speech finished');
    };

    utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        SpeechState.speaking = false;
        if (activeButton) {
            activeButton.classList.remove('speaking');
            activeButton.querySelector('.speak-icon').textContent = '🔊';
            activeButton.querySelector('.speak-text').textContent = 'Listen';
        }
        
        if (event.error === 'not-allowed') {
            alert('Please allow audio playback in your browser settings.');
        }
    };

    window.speechSynthesis.speak(utterance);
}

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log(`🎤 Loaded ${voices.length} voices`);
    };
}