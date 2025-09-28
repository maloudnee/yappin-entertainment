(() => {
    // Check if extension already injected into window
    if (window.__yappinInjected) return;
    window.__yappinInjected = true;

    // Determine if on watch or browsing page
    const path = window.location.pathname;

    // Determine current profile
    let curr_profile = null;

    // On browsing page
    if(!path.includes("/watch")) {
        const params = new URLSearchParams(window.location.search);
        let showId = params.get("jbv") || "70143824";
        if (params.has("jbv")) showId = params.get("jbv");
        console.log("Browse showId:", showId);


            // Create overlay
            const overlay = document.createElement("div");
            overlay.id = 'yappin-overlay';
            overlay.style.position = 'fixed';
            overlay.style.bottom = '20px';
            overlay.style.right = '20px';
            overlay.style.background = 'rgba(255, 255, 255, 0.8)';
            overlay.style.padding = '10px';
            overlay.style.borderRadius = '13px';
            overlay.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
            overlay.style.zIndex = "2147483647";
            overlay.style.display = 'flex';
            overlay.style.gap = '10px';
            overlay.style.maxWidth = '250px';
            overlay.style.fontFamily = 'Arial, sans-serif'
            document.body.appendChild(overlay);

            const profiles = [
                { id: 'mal', name: 'Mal', icon:chrome.runtime.getURL("images/mal.png") },
                { id: 'showtime', name: "Showtime", icon:chrome.runtime.getURL("images/showtime.png") },
                { id: 'makevili', name: "Makevili", icon:chrome.runtime.getURL("images/makevili.png") }
            ];

            // Save to storage if not already saved
            chrome.storage.local.get("profiles", data => {
                if (!data.profiles) {
                    chrome.storage.local.set({ profiles });
                }
            });

            // Finding out which user is currently using and saving it
            let USER_PROFILE_ID = profiles[0].id // default
            const profileSelector = document.createElement('select');
            profiles.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.name;
                profileSelector.appendChild(option);
            });

            // Load last profile saved if applicable 
            chrome.storage.local.get("curr_profile", data => {
                if(data.curr_profile) {
                    USER_PROFILE_ID = data.curr_profile;
                    profileSelector.value = USER_PROFILE_ID;
                }
            });

            profileSelector.style.marginBottom = '10px';
            profileSelector.style.padding = '6px';
            profileSelector.style.borderRadius = '7px';
            profileSelector.style.border = '1px solid #ccc';
            overlay.appendChild(profileSelector);

            profileSelector.onchange = () => {
                USER_PROFILE_ID = profileSelector.value;
                chrome.storage.local.set({ curr_profile: USER_PROFILE_ID }, () => {
                    console.log("Profile saved:", USER_PROFILE_ID);
                });
            };


            // Creating overlays for each profile
            profiles.forEach(profile => {
                const btn = document.createElement("div");
                btn.className = 'yappin-profile-btn';
                btn.style.display = 'flex';
                btn.style.alignItems = 'flex-start';
                btn.style.cursor = 'pointer';
                btn.style.padding = '6px 10px';
                btn.style.borderRadius = '10px';
                btn.style.transition = 'transform 0.2s';

                btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
                btn.onmouseout = () => btn.style.transform = 'scale(1.0)';

                btn.innerHTML = `<img src="${profile.icon}" style="width:32px;height:32px;border-radius:50%;margin-right:8px;">
                                <span>${profile.name}</span>`
                
                btn.onclick = () => {
                    const box = document.createElement("div");
                    box.id = 'yappin-rating-box';
                    box.style.marginTop = '8px';
                    box.style.background = '#242424';
                    box.style.padding = '8px';
                    box.style.width = '200px';
                    box.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.2)';
                    box.style.color = 'white';
                    box.style.fontSize = '14px';

                    // Load stored ratings and thoughts for show
                    let data = JSON.parse(localStorage.getItem(`yappin-show-${showId}`) || '{}');
                    data.profiles = data.profiles || {};
                    const profileData = data.profiles[profile.id] || {};

                    if (profileData.rating && profileData.thoughts) {
                        const stars = '⭐️'.repeat(profile.rating) + '☆'.repeat(5 - profile.rating);
                        box.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts :</strong>${profileData.thoughts}`;
                    } else if (profile.id == USER_PROFILE_ID) {
                        // Get ratings and thoughts for show/movie
                        const ratingLabel = document.createElement('label');
                        ratingLabel.textContent = "What do you rate this from 1 to 5?";
                        ratingLabel.style.display = 'block';

                        const ratingInput = document.createElement('input');
                        ratingInput.type = "number";
                        ratingInput.min = "1";
                        ratingInput.max = "5";
                        ratingInput.style.marginBottom = '6px';

                        const input = document.createElement('textarea');
                        input.placeholder = "Yap away .. "
                        input.style.width = '100%';
                        input.style.borderRadius = '7px';
                        input.style.marginBottom = '6px';
                        input.style.padding = '4px';
                    

                        // Save data
                        const saveBtn = document.createElement('button');
                        saveBtn.textContent = 'SAVE';
                        saveBtn.style.width = '100%';
                        saveBtn.style.padding = '6px';
                        saveBtn.style.border = 'none';
                        saveBtn.style.borderRadius = '7px';
                        saveBtn.style.background = '#8B0000';
                        saveBtn.style.color = 'white';
                        saveBtn.style.cursor = 'pointer';

                        saveBtn.onclick = () => {
                            profileData.rating = parseInt(ratingInput.value) || 0;
                            profileData.thoughts = input.value;
                            data.profiles[profile.id] = profileData;
                            localStorage.setItem(`yappin-show-${showId}`, JSON.stringify(data));
                            const stars = '⭐️'.repeat(profile.rating) + '☆'.repeat(5 - profile.rating);
                            box.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong> ${profileData.thoughts}`;
                        };
                        box.appendChild(ratingLabel);
                        box.appendChild(ratingInput);
                        box.appendChild(input);
                        box.appendChild(saveBtn);
                    } else {
                        box.innerHTML = `<strong>${profile.name} </strong> either didn't watch this or found it that unimpressive.`
                    }
                    btn.appendChild(box);
                };
                overlay.appendChild(btn);
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