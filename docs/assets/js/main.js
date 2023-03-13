const tabViewMap = {
    'apps': `<div id="tab-view-apps" class="tab-view">
        <br /><br />
        <assistant-apps-apps-list>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-apps-list>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-apps-list&gt;&lt;/assistant-apps-apps-list&gt;</code
        ></pre>
    </div>`,
    'app-notices': `<div id="tab-view-app-notices" class="tab-view">
        <assistant-apps-app-notice-list-search>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-app-notice-list-search>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-app-notice-list appguid="assistantAppsAppGuid" langcode="languageCode" /&gt;</code
        ></pre>
    </div>`,
    'badges': `<div id="tab-view-badges" class="tab-view">
        <assistant-apps-badge-selector>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-badge-selector>

        <br />
        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-review-badge apptype="assistantAppsAppType" platform="platformType" fallbackimg="optional fallback img" /&gt;
&lt;assistant-apps-version-badge appguid="assistantAppsAppGuid" fallbackimg="optional fallback img" /&gt;</code
        ></pre>
    </div>`,
    'donators': `<div id="tab-view-donators" class="tab-view">
        <assistant-apps-donators-list>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-donators-list>

        <br />
        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-donators-list/&gt;&lt;assistant-apps-donators-list&gt;</code
        ></pre>
    </div>`,
    'patreon': `<div id="tab-view-patreon" class="tab-view">
        <assistant-apps-patreon-list>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-patreon-list>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-patreon-list&gt;&lt;/assistant-apps-patreon-list&gt;</code
        ></pre>
    </div>`,
    'steam-news': `<div id="tab-view-steam-news" class="tab-view">tab-view-steam-news</div>`,
    'team-members': `<div id="tab-view-team-members" class="tab-view">
        <assistant-apps-team-list>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-team-list>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-team-list&gt;&lt;/assistant-apps-team-list&gt;</code
        ></pre>
    </div>`,
    'translations-per-lang': `<div id="tab-view-translations-per-lang" class="tab-view">tab-view-translations-per-lang</div>`,
    'translations-leaderboard': `<div id="tab-view-translations-leaderboard" class="tab-view">
        <assistant-apps-translation-leaderboard>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-translation-leaderboard>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-translation-leaderboard&gt;&lt;assistant-apps-translation-leaderboard&gt;</code
        ></pre>
    </div>`,
    'versions': `<div id="tab-view-versions" class="tab-view">
        <assistant-apps-version-search>
            <div class="slot-loading" slot="loading">
                <img src="/assets/img/circles.svg" alt="loading" />
            </div>
        </assistant-apps-version-search>

        <i>Code:</i><br />
        <pre><code class="language-html"
            >&lt;assistant-apps-version-search&gt;&lt;assistant-apps-version-search&gt;</code
        ></pre>
    </div>`,
};

function handleTabClick() {
    const tabBtns = document.getElementsByClassName('tab-button');
    for (const tabBtn of tabBtns) {
        tabBtn.classList.remove('active');
    }

    const tabViews = document.getElementsByClassName('tab-view');
    for (const tabView of tabViews) {
        tabView.classList.remove('active');
    }

    setCurrentTab(this);
    // setTimeout(() => setCurrentTab(this), 250);
}

function setCurrentTab(btnRef) {
    btnRef.classList.add('active');

    const viewElemTemplId = btnRef.id.replace('tab-', '');
    const tabView = tabViewMap[viewElemTemplId];
    if (tabView == null) return;

    const tabViewWrapper = document.getElementById('tab-view-content');
    tabViewWrapper.innerHTML = tabView;

    hljs.highlightAll();

    setTimeout(() => {
        const viewElemId = `tab-view-${viewElemTemplId}`;
        const tabView = document.getElementById(viewElemId);
        tabView.classList.add('active');
    }, 250);
}

function setUpTabs() {
    const tabBtns = document.getElementsByClassName('tab-button');
    for (const tabBtn of tabBtns) {
        tabBtn.addEventListener("click", handleTabClick)
    }

    setCurrentTab(tabBtns[0])
}

setUpTabs();
hljs.highlightAll();