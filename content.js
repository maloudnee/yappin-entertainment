(() => {
    // Check if extension already injected into window
    if (window.__yappinInjected) return;
    window.__yappinInjected = true;

    // Determine if on watch or browsing page
    const path = window.location.pathname;

    // Load profiles and current user
    function loadProfiles(callback) {
        const profiles = [
            { id: 'mal', name: 'Mal', icon:chrome.runtime.getURL("images/mal.png") },
            { id: 'showtime', name: 'Showtime', icon:chrome.runtime.getURL("images/showtime.png") },
            {id: 'makevili', name: 'Makevili', icon:chrome.runtime.getURL("images/makevili.png") }
        ];
        chrome.storage.local.get(["profiles", "current_profile"], data => {
            if (!data.profiles) chrome.storage.local.set({ profiles });
            callback(profiles, data.current_profile || profiles[0].id);
        });
    }

    // ======================================================================
    // BROWSE PAGE: ?jbv=xxxx
    // ======================================================================
    if(!path.includes("/watch")) {
        const params = new URLSearchParams(window.location.search);
        const showId = params.get("jbv");
        if (!showId) return;

        const profiles = [
            { id: 'mal', name: 'Mal', icon:chrome.runtime.getURL("images/mal.png") },
            { id: 'showtime', name: "Showtime", icon:chrome.runtime.getURL("images/showtime.png") },
            { id: 'makevili', name: "Makevili", icon:chrome.runtime.getURL("images/makevili.png") }
        ];

        // Load last profile saved if applicable 
        chrome.storage.local.get("current_profile", data => {
            const USER_PROFILE_ID = data.current_profile || profiles[0].id;

            // Find description of shows/movies
            const descriptionElement = document.querySelector('.ptrack-content');
            if (!descriptionElement) return;

            // Profile bubbles container
            const bubbleContainer = document.createElement('div');
            bubbleContainer.style.display = 'flex';
            bubbleContainer.style.gap = '8px';
            bubbleContainer.style.marginTop = '12px';

            profiles.forEach(profile => {
                const bubble = document.createElement('div');
                bubble.style.display = 'flex';
                bubble.style.alignItems = 'center';
                bubble.style.padding = '6px 10px';
                bubble.style.background = 'rgba(54, 69, 79, 0.9)';
                bubble.style.cursor = 'pointer';
                bubble.style.color = 'white';
                bubble.style.fontSize = '14px';
                bubble.style.gap = '8px';
                bubble.style.minWidth = '100px';

                const img = document.createElement('img');
                img.src = profile.icon;
                img.style.width = '32px';
                img.style.height = '32px';
                img.style.borderRadius = '50%';

                const name = document.createElement('span');
                name.textContent = profile.name;

                bubble.appendChild(img);
                bubble.appendChild(name);

                bubble.onclick = () => {
                    const existingPopup = document.getElementById('profile-popup');
                    if (existingPopup) existingPopup.remove();

                    const popup = document.createElement('div');
                    popup.id = 'profile-popup';
                    const rect = bubble.getBoundingClientRect();
                    popup.style.position = 'absolute';
                    popup.style.top = rect.bottom + window.scrollY + 'px';
                    popup.style.bottom = rect.left + window.scrollX + 'px';
                    popup.style.background = '#242424';
                    popup.style.padding = '10px';
                    popup.style.borderRadius = '10px';
                    popup.style.color = '#FAF9F6'
                    popup.style.minWidth = '200px';
                    popup.style.boxShadow = '0 2px 8px rgba(0, 0,0 , 0.5)';
                    popup.style.zIndex = '9999';

                    let data = JSON.parse(localStorage.getItem(`yappin-show-${showId}`) || '{}');
                    data.profiles = data.profiles || {};
                    const profileData = data.profiles[profile.id] || {};

                    if (profileData.rating && profileData.thoughts) {
                        const stars = '⭐️'.repeat(profile.rating) + '☆'.repeat(5 - profile.rating);
                        popup.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong>${profileData.thoughts}`;
                    } else if (profile.id === USER_PROFILE_ID) {
                        const input = prompt("What do you rate this from 1 to 5?");
                        const rating = parseInt(input);
                        if(!isNaN(rating) && rating >= 1 && rating <= 5) {
                            profileData.rating = rating;
                            const stars = '⭐️'.repeat(profileData.rating) + '☆'.repeat(5 - profile.rating);
                            profileData.thoughts = prompt("Yap away ... ");
                            localStorage.setItem(`yappin-show-${showId}`, JSON.stringify(data));
                            popup.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong>${profileData.thoughts}`;
                        } else {
                            alert("Invalid rating! Has to be a number between 1 and 5.");
                        }
                        const saveBtn = document.createElement('button');
                        saveBtn.textContent = 'SAVE';
                        saveBtn.style.width = '100%';
                        saveBtn.style.padding = '6px';
                        saveBtn.style.border = 'none';
                        saveBtn.style.borderRadius = '7px';
                        saveBtn.style.background = '#8B0000';
                        saveBtn.style.color = 'white';
                        saveBtn.style.cursor = 'pointer';
                    } else {
                        popup.innerHTML = `<strong>${profile.name}</strong> either didn't watch this or found it unimpressive.`;
                    }
                    document.body.appendChild(popup);
                };
                bubbleContainer.appendChild(bubble);
            });
            descriptionElement.parentNode.insertBefore(bubbleContainer, descriptionElement.nextSibling);

        });
        return; // Stop on browsing pages
    }

        // On watch page
        const showId = path.split("/watch/")[1];
        const video = document.querySelector("video");
        if (!video) return;
        console.log("Watch showId:", showId);
        
        // Helper to get profiles and current profile as a promise
        function loadData() {
            return new Promise(resolve => {
                chrome.storage.local.get(["profiles", "curr_profile"], data => {
                    const profiles = data.profiles || [];
                    const USER_PROFILE_ID = data.curr_profile || null;
                    resolve({ profiles, USER_PROFILE_ID });
                });
            });
        }
        
        // Storage helpers
        function saveComment(profileId, showId, timestamp, text) {
            chrome.storage.local.get("comments", data => {
                const comments = data.comments || {};
                if (!comments[showId]) comments[showId] = {};
                if (!comments[showId][profileId]) comments[showId][profileId] = [];
                comments[showId][profileId].push({ timestamp, text });
                chrome.storage.local.set({ comments });
            });
        }
        
        function loadComments(callback) {
            chrome.storage.local.get("comments", data => {
                const comments = (data.comments || {})[showId] || {};
                callback(comments);
            });
        }
        
        // Message container
        const container = document.createElement("div");
        container.id = "yappin-popup-container";
        container.style.position = "absolute";
        container.style.bottom = "60px";
        container.style.left = "20px";
        container.style.zIndex = "2147483647";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "6px";
        container.style.pointerEvents = "none";
        document.body.appendChild(container);
        
        // Bubble display function
        function showBubble(profile, text) {
            const bubble = document.createElement("div");
            bubble.className = "yappin-message-bubble";
            bubble.style.background = "#0b93f6"; 
            bubble.style.color = "white";
            bubble.style.padding = "8px 12px";
            bubble.style.borderRadius = "18px";
            bubble.style.display = "inline-flex";
            bubble.style.alignItems = "center";
            bubble.style.fontSize = "14px";
            bubble.style.maxWidth = "250px";
            bubble.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
            bubble.style.transform = "translateY(20px)";
            bubble.style.opacity = "0";
            bubble.style.transition = "all 0.3s ease-out";
            bubble.style.gap = "8px";
        
            const img = document.createElement("img");
            img.src = profile.icon || "";
            img.style.width = "28px";
            img.style.height = "28px";
            img.style.borderRadius = "50%";
            bubble.appendChild(img);
        
            const textSpan = document.createElement("span");
            textSpan.textContent = `${profile.name}: ${text}`;
            bubble.appendChild(textSpan);
        
            container.appendChild(bubble);
        
            requestAnimationFrame(() => {
                bubble.style.transform = "translateY(0)";
                bubble.style.opacity = "1";
            });
        
            const audio = new Audio(chrome.runtime.getURL("sounds/sentmessage_1.mp3"));
            audio.play();
        
            setTimeout(() => bubble.remove(), 5000);
        }
        
        // Main watch page logic
        loadData().then(({ profiles, USER_PROFILE_ID }) => {
            const shown = new Set();
        
            // Interval to show comments at the right timestamps
            setInterval(() => {
                const t = Math.floor(video.currentTime);
                loadComments(showComments => {
                    Object.keys(showComments).forEach(profileId => {
                        const msgs = showComments[profileId];
                        msgs.forEach(msg => {
                            const key = profileId + '|' + msg.timestamp + '|' + msg.text;
                            if (msg.timestamp === t && !shown.has(key)) {
                                const profile = profiles.find(p => p.id === profileId) || { name: profileId, icon: "" };
                                showBubble(profile, msg.text);
                                shown.add(key);
                            }
                        });
                    });
                });
            }, 500);
        
            // Add comment button
            const addBtn = document.createElement("button");
            addBtn.textContent = "+";
            addBtn.style.position = "absolute";
            addBtn.style.bottom = "80px";
            addBtn.style.right = "30px";
            addBtn.style.padding = "10px";
            addBtn.style.borderRadius = "50%";
            addBtn.style.fontSize = "20px";
            addBtn.style.cursor = "pointer";
            addBtn.style.zIndex = "2147483647";
            document.body.appendChild(addBtn);
        
            addBtn.onclick = () => {
                if (!USER_PROFILE_ID) {
                    alert("Please pick a profile first from the browser page.");
                    return;
                }
                const text = prompt("Yap about what you just saw");
                if (text) {
                    const t = Math.floor(video.currentTime);
                    saveComment(USER_PROFILE_ID, showId, t, text);
                    alert("Message saved @ " + t + "s!");
                    const profile = profiles.find(p => p.id === USER_PROFILE_ID) || { name: USER_PROFILE_ID, icon: "" };
                    showBubble(profile, text);
                }
            };
        });
})();