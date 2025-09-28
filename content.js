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
        console.log("Browse showID:", showId);


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
            overlay.style.zIndex = 2147483647;
            overlay.style.display = 'flex';
            overlay.style.gap = '10px';
            overlay.style.maxWidth = '250px';
            overlay.style.fontFamily = 'Arial, sans-serif'
            document.body.appendChild(overlay);

            const profiles = [
                { id: 'mal', name: 'Mal', icon:"images/mal.png", },
                { id: 'showtime', name: "Showtime", icon:"images/showtime.png"},
                { id: 'makevili', name: "Makevili", icon:"images/makevili.png"}
            ];

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
                            box.innterHTML = `<strong>Rating:</strong> ${stars}<br><strong>${profile.name}'s thoughts: </strong> ${profileData.thoughts}`;
                        };
                        box.appendChild(ratingLabel);
                        box.appendChild(ratingInput);
                        box.appendChild(input);
                        box.appendChild(saveBtn);
                    } else {
                        box.innterHTML = `<strong>${profile.name} </strong> either didn't watch this or found it that unimpressive.`
                    }
                    btn.appendChild(box);
                };
                overlay.appendChild(btn);
            });
            return; // Stop on browsing pages
        }

        // On watch page
        const showId = path.split("/watch/")[1]
        const video = document.querySelector("video");
        if (!video) return;
        console.log("Watch showId:", showId)

})();