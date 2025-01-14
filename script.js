// ==UserScript==
// @name         ChatGPT Navigation Buttons
// @namespace    http://your-namespace
// @version      1.3
// @description Adds navigation buttons to ChatGPT for quick message navigation
// @match        *://chat.openai.com/*|*://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  /************************************************************************
   * 1) POLLING FOR MAIN ELEMENTS (e.g., scroll-to-bottom button)
   ************************************************************************/
  const pollInterval = setInterval(() => {
    // Selector for the "Scroll to Bottom" button or a stable parent element
    const scrollToBottomBtn = document.querySelector(
      'button.cursor-pointer.absolute.z-10.rounded-full.bg-clip-padding.border'
    );
    if (scrollToBottomBtn) {
      clearInterval(pollInterval);
      insertNavButtons(scrollToBottomBtn);
      injectStyles();
      addButtonListeners();
      observeNewMessages(); // Optional: Handle dynamic content
    }
  }, 1000);

  /************************************************************************
   * 2) CREATE & INSERT THE NAV BUTTONS
   ************************************************************************/
  function insertNavButtons(scrollToBottomBtn) {
    // Prevent duplicate insertion
    if (document.getElementById('custom-nav-container')) return;

    // Create container for navigation buttons
    const container = document.createElement('div');
    container.id = 'custom-nav-container';
    container.style.position = 'absolute';
    container.style.bottom = '60px'; // Position above the "Scroll to Bottom" button
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = '6px';
    container.style.zIndex = '999999'; // Ensure it's on top

    // Append the container to the parent of the scroll button
    scrollToBottomBtn.parentElement.appendChild(container);

    // Define button data
    const buttons = [
      {
        id: 'btn-go-first-user',
        title: 'Go to First User Message',
        icon: 'https://img.icons8.com/ios-filled/24/ffffff/skip-to-start.png',
      },
      {
        id: 'btn-go-last-user',
        title: 'Go to Last User Message',
        icon: 'https://img.icons8.com/ios-filled/24/ffffff/end.png',
      },
      {
        id: 'btn-go-latest-assistant',
        title: 'Go to Latest Assistant Message',
        icon: 'https://img.icons8.com/ios-filled/24/ffffff/chat.png',
      },
      {
        id: 'btn-go-up-one',
        title: 'Go Up One Message',
        icon: 'https://img.icons8.com/ios-filled/24/ffffff/up.png',
      },
    ];

    // Create and append each button
    buttons.forEach(btnInfo => {
      const btn = document.createElement('button');
      btn.id = btnInfo.id;
      btn.title = btnInfo.title;
      btn.style.width = '28px';
      btn.style.height = '28px';
      btn.style.borderRadius = '50%';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.backgroundColor = '#333';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.padding = '0';
      btn.style.margin = '0';

      // Hover effect
      btn.addEventListener('mouseover', () => (btn.style.backgroundColor = '#555'));
      btn.addEventListener('mouseout', () => (btn.style.backgroundColor = '#333'));

      // Set button icon
      const img = document.createElement('img');
      img.src = btnInfo.icon;
      img.alt = btnInfo.title;
      img.style.width = '14px';
      img.style.height = '14px';
      btn.appendChild(img);

      // Append button to container
      container.appendChild(btn);
    });
  }

  /************************************************************************
   * 2.1) INJECT STYLES
   ************************************************************************/
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #custom-nav-container button {
        transition: background-color 0.3s;
      }
      #custom-nav-container button img {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  /************************************************************************
   * 3) ATTACH EVENT LISTENERS FOR BUTTON FUNCTIONALITY
   ************************************************************************/
  function addButtonListeners() {
    // Selectors based on data attributes for robustness
    // Updated to target child divs and then traverse to parent article
    const allMessages = () => Array.from(document.querySelectorAll('article'));

    // 3.1) Go to First User Message
    const firstUserBtn = document.getElementById('btn-go-first-user');
    if (firstUserBtn) {
      firstUserBtn.addEventListener('click', () => {
        const firstUserDiv = document.querySelector('div[data-message-author-role="user"]');
        const firstUserEl = firstUserDiv ? firstUserDiv.closest('article') : null;
        if (firstUserEl) {
          firstUserEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback if not found
          window.scrollTo({ top: 0, behavior: 'smooth' });
          console.warn('First user message not found. Scrolled to top.');
        }
      });
    }

    // 3.2) Go to Last User Message
    const lastUserBtn = document.getElementById('btn-go-last-user');
    if (lastUserBtn) {
      lastUserBtn.addEventListener('click', () => {
        const userDivs = document.querySelectorAll('div[data-message-author-role="user"]');
        const lastUserDiv = userDivs.length > 0 ? userDivs[userDivs.length - 1] : null;
        const lastUserEl = lastUserDiv ? lastUserDiv.closest('article') : null;
        if (lastUserEl) {
          lastUserEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          alert('Could not find the last user message.');
        }
      });
    }

    // 3.3) Go to Latest Assistant Message
    const latestAsstBtn = document.getElementById('btn-go-latest-assistant');
    if (latestAsstBtn) {
      latestAsstBtn.addEventListener('click', () => {
        const asstDivs = document.querySelectorAll('div[data-message-author-role="assistant"]');
        const latestAsstDiv = asstDivs.length > 0 ? asstDivs[asstDivs.length - 1] : null;
        const latestAsstEl = latestAsstDiv ? latestAsstDiv.closest('article') : null;
        if (latestAsstEl) {
          latestAsstEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          alert('Could not find the latest assistant message.');
        }
      });
    }

    // 3.4) Go Up One Message
    let currentIndex = -1;

    function findClosestIndex() {
      const articles = allMessages();
      let minDist = Infinity;
      let foundIdx = -1;
      const centerY = window.innerHeight / 2;

      articles.forEach((article, i) => {
        const rect = article.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - centerY);
        if (dist < minDist) {
          minDist = dist;
          foundIdx = i;
        }
      });

      if (foundIdx !== -1) currentIndex = foundIdx;
    }

    // Update currentIndex on scroll
    window.addEventListener('scroll', findClosestIndex);
    // Initial index calculation
    findClosestIndex();

    const upOneBtn = document.getElementById('btn-go-up-one');
    if (upOneBtn) {
      upOneBtn.addEventListener('click', () => {
        const articles = allMessages();
        if (!articles.length) {
          alert('No messages found to navigate.');
          return;
        }

        if (currentIndex <= 0) {
          alert('Already at the first message or no previous message available.');
          return;
        }

        const newIndex = currentIndex - 1;
        const targetEl = articles[newIndex];
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          currentIndex = newIndex;
        }
      });
    }
  }

  /************************************************************************
   * 4) OPTIONAL: HANDLE DYNAMIC CONTENT WITH MutationObserver
   ************************************************************************/
  function observeNewMessages() {
    const targetNode = document.querySelector('main'); // Adjust based on actual structure
    if (!targetNode) return;

    const config = { childList: true, subtree: true };

    const callback = (mutationsList) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Optionally, update any state or handle new messages
          // For example, reset currentIndex
          findClosestIndex();
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

})();
