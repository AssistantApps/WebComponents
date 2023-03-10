function handleTabClick() {
    const tabBtns = document.getElementsByClassName('tab-button');
    for (const tabBtn of tabBtns) {
        tabBtn.classList.remove('active');
    }

    const tabViews = document.getElementsByClassName('tab-view');
    for (const tabView of tabViews) {
        tabView.classList.remove('active');
    }

    setTimeout(() => setCurrentTab(this), 250);
}

function setCurrentTab(btnRef) {
    btnRef.classList.add('active');

    const viewElemId = btnRef.id.replace('tab-', 'tab-view-');
    const tabView = document.getElementById(viewElemId);
    tabView.classList.add('active');
}

function setUpTabs() {
    const tabBtns = document.getElementsByClassName('tab-button');
    for (const tabBtn of tabBtns) {
        tabBtn.addEventListener("click", handleTabClick)
    }

    setCurrentTab(tabBtns[1])
}

setUpTabs();