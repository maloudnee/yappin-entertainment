(() => {
    // Check if extension already injected into window
    if (window.__yappinInjected) return;
    window.__yappinInjected = true;

    // Clean UI with each profile change
    // ======================================================================
    // CURRENT PROFILE ?
    // ======================================================================
    function getCurrentProfileId() {
        const accountLink = document.querySelector('a[aria-label*="Account"]');
        if (!accountLink) return null;

        const ariaLabel = accountLink.getAttribute('aria-label');
        if(!ariaLabel) return null;

        // Get profile name and icon
        const name = ariaLabel.split(' - ')[0].toLowerCase();
        const profileImg = document.querySelector('img.profile-icon') || null;
        const icon = profileImg ? profileImg.src: null;

        return { id: name.toLowerCase(), name, icon };
    }

    function activeProfileId() {
        return getCurrentProfileId();
    }

    console.log("Yappin script started"); 

    // Clean UI with each profile change
    function cleanYappinUI(){
        // Remove profile popup
        document.querySelectorAll('#profile-popup, #yappin-bubbles, #yappin-popup-container').forEach(el => el.remove());
    }

    // ======================================================================
    // BROWSE PAGE: ?jbv=xxxx
    // ======================================================================
    function handleBrowse() {
        const params = new URLSearchParams(window.location.search);
        const showId = params.get("jbv");
        if (!showId) return console.log("No showId, returning");
        console.log(showId)

        // Add profile to local storage
        const currentProfile = getCurrentProfileId();
        if (currentProfile) {
            chrome.storage.local.set({ current_profile : currentProfile}, () => {
                console.log("Saved profile:", getCurrentProfileId());
            });
        }        

        chrome.storage.local.get(["current_profile", "profiles"], data => {
            const current = data.current_profile;
            let profiles = data.profiles || [];
            if (current && !profiles.find(p => p.id === current.id)) {
                profiles.push(current);
                chrome.storage.local.set({ profiles });
            }

            // Find description of shows/movies
            const descriptionElement = document.evaluate(
                "/html/body/div[2]/div/div/div/div/div[1]/div[2]/div/div[3]/div/div[1]/div/div/div[1]/p/div",
                document, 
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
            
            if (!descriptionElement) return;
            console.log("Found description element!", descriptionElement);

            // Profile bubbles container
            if (document.getElementById("yappin-bubbles")) return;
            const bubbleContainer = document.createElement('div');
            bubbleContainer.id = "yappin-bubbles";
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
                    popup.style.left = rect.left + window.scrollX + 'px';
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
                        const stars = '⭐️'.repeat(profileData.rating) + '☆'.repeat(5 - profileData.rating);
                        popup.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong>${profileData.thoughts}`;
                    } else if (profile.id === activeProfileId()?.id) {
                        const input = prompt("What do you rate this from 1 to 5?");
                        const rating = parseInt(input);
                        if(!isNaN(rating) && rating >= 1 && rating <= 5) {
                            profileData.rating = rating;
                            const stars = '⭐️'.repeat(profileData.rating) + '☆'.repeat(5 - profileData.rating);
                            profileData.thoughts = prompt("Yap away ... ");
                            localStorage.setItem(`yappin-show-${showId}`, JSON.stringify(data));
                            popup.innerHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong>${profileData.thoughts}`;
                        } else {
                            alert("Invalid rating! Has to be a number between 1 and 5.");
                        }
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

        // =================================================================
        // WATCHING PAGE
        // =================================================================
        function handleWatch() {
            console.log("On watch page")
            const path = window.location.pathname;
            const showId = path.split("/watch/")[1];

            function injectAddButton() {
                // Grab volume button
                const volumeIcon = document.querySelector('svg[data-icon^="Volume"]');
                if (!volumeIcon) return;

                // Avoid duplicates
                const volumeBtn = volumeIcon.closest('button');
                if (!volumeBtn || volumeBtn.dataset.hasYap) return;

                // Creating + Button
                const addBtn = document.createElement('button');
                addBtn.textContent = "+";
                addBtn.style.marginLeft = "12px";       
                addBtn.style.color = "white";
                addBtn.style.background = "transparent";
                addBtn.style.border = "none";
                addBtn.style.fontSize = "28px";         
                addBtn.style.fontWeight = "bold";
                addBtn.style.cursor = "pointer";
                addBtn.style.zIndex = "9999";
                addBtn.style.pointerEvents = "auto";
                addBtn.style.display = "flex";
                addBtn.style.alignItems = "center";
                addBtn.style.justifyContent = "center"

                // Adding messages
                addBtn.onclick = () => {
                    const video = document.querySelector("video");
                    if(!video) return;
                    const t = Math.floor(video.currentTime);

                    const text = prompt("Yap away ...");
                    if(!text) return;

                    const showId = path.split("/watch/")[1];
                    let data = JSON.parse(localStorage.getItem(`yappin-comments-${showId}`) || "{}");
                    if(!data[t]) data[t] = [];
                    data[t].push(text);
                    localStorage.setItem(`yappin-comments-${showId}`, JSON.stringify(data));

                    showPopup("You", text);
                };
                // Mark parent to avoid injecting twice
                volumeBtn.parentNode.insertBefore(addBtn, volumeBtn.nextSibling);
                volumeBtn.dataset.hasYap = "true";
            }

            // Display user's comments like twitch
            function showPopup(user, text){
                const container = document.getElementById("yappin-popup-container") || (() =>{
                    const c = document.createElement('div');
                    c.style.position = 'absolute';
                    c.style.bottom = '80px';
                    c.style.left = '20px';
                    c.style.zIndex = '2147483647';
                    c.style.display = 'flex';
                    c.style.flexDirection = 'column';
                    c.style.gap = '6px';
                    document.body.appendChild(c);
                    return c;
                })();

                const bubble = document.createElement("div");
                bubble.textContent = `${user}: ${text}`;
                bubble.style.background = "#0b93f6";
                bubble.style.color = "white";
                bubble.style.padding = "8px 12px";
                bubble.style.borderRadius = "18px";
                bubble.style.fontSize = "14px";
                bubble.style.maxWidth = "250px";
                bubble.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
                bubble.style.opacity = "0";
                bubble.style.transition = "opacity 0.3s ease";

                container.appendChild(bubble);
                requestAnimationFrame(() => bubble.style.opacity = "1");
                
                // Disappear after 5 seconds
                setTimeout(() => bubble.remove(), 5000);
            }

            // Rerun injection
            setInterval(injectAddButton, 1000);

            // Look for stored messages at current timestamp
            setInterval(() => {
                const video = document.querySelector("video");
                if (!video) return;
            
                const now = video.currentTime;
                const showId = window.location.pathname.split("/watch/")[1];
                let data = JSON.parse(localStorage.getItem(`yappin-comments-${showId}`) || "{}");
                
                // In case someone rewinds
                Object.keys(data).forEach(time => {
                    const t = parseFloat(time);
            
                    if (Math.abs(now - t) < 1) {
                        data[t].forEach(msg => showPopup("OtherUser", msg));
                    }
                });
            }, 300);
        }

        // ========================================================================
        // HANDLING URL CHANGES
        // ========================================================================

        function pageChange() {
            // Get rid of any lingering items 
            cleanYappinUI();
            
            // Determine if on watch or browsing page
            const path = window.location.pathname;
            if(!path.includes("/watch")) handleBrowse();
            else handleWatch();
        }

        // Run initially
        pageChange();
        
        // Observe URL Changes
        let lastUrl = location.href;
        new MutationObserver(() => {
            if(location.href !== lastUrl) {
                lastUrl = location.href;
                pageChange();
            }
        }).observe(document, { subtree: true, childList: true });

})();