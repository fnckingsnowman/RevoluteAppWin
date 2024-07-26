document.addEventListener('DOMContentLoaded', () => {
    let tabCounter = 1;

    // Function to show a specific tab
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab button').forEach(button => {
            button.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`button[data-tab="${tabId}"]`).classList.add('active');
    }

    // Function to add a new tab
    window.addNewTab = function() {
        tabCounter++;
        const tabId = `tab${tabCounter}`;
        const tabButtonId = `tabButton${tabCounter}`;
        
        const newTabButton = document.createElement('div');
        newTabButton.className = 'tab';
        newTabButton.id = tabButtonId;
        newTabButton.innerHTML = `
            <button data-tab="${tabId}" onclick="showTab('${tabId}')">Tab ${tabCounter}</button>
            <button class="delete-tab" onclick="deleteTab('${tabId}', '${tabButtonId}')">&times;</button>
        `;
        document.getElementById('tabs').appendChild(newTabButton);

        const newTabContent = document.createElement('div');
        newTabContent.id = tabId;
        newTabContent.className = 'tab-content';
        newTabContent.innerHTML = `
            <div class="header">Tab ${tabCounter}</div>
            <label for="f11key${tabCounter}">F11 Output Key:</label>
            <input type="text" id="f11key${tabCounter}" maxlength="1">
            <br>
            <label for="f12key${tabCounter}">F12 Output Key:</label>
            <input type="text" id="f12key${tabCounter}" maxlength="1">
            <br>
            <button onclick="startHook(${tabCounter})">Start Hook</button>
            <button onclick="stopHook(${tabCounter})">Stop Hook</button>
        `;
        document.getElementById('content').appendChild(newTabContent);

        showTab(tabId);
    };

    // Function to delete a tab
    window.deleteTab = function(tabId, tabButtonId) {
        document.getElementById(tabId).remove();
        document.getElementById(tabButtonId).remove();
        
        // Show the first tab if any tabs are left
        const firstTab = document.querySelector('.tab-content');
        if (firstTab) {
            showTab(firstTab.id);
        }
    };

    // Initial tab is shown by default
    showTab('tab1');
});

// Functions to start and stop the hook
function startHook(tabNumber) {
    const f11Key = document.getElementById(`f11key${tabNumber}`).value;
    const f12Key = document.getElementById(`f12key${tabNumber}`).value;
    window.electronAPI.setF11Key(f11Key);
    window.electronAPI.setF12Key(f12Key);
    window.electronAPI.startHook();
}

function stopHook(tabNumber) {
    window.electronAPI.stopHook();
}
