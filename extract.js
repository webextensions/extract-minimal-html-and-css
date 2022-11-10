const _utilsForExtract = {};

_utilsForExtract.timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Timeouts and Intervals both get cleared by this function
_utilsForExtract.clearAllTimeoutsAndIntervals = function () {
    const idForTimeout1 = window.setTimeout(function () {}, 0);
    const idForTimeout2 = window.setTimeout(function () {}, 0);

    // To handle scenario where window.setTimeout might have been hijacked
    let targetIdForTimeout = idForTimeout2 + (idForTimeout2 - idForTimeout1 - 1);

    // Seemingly, "targetIdForTimeout > 0" would be fine, but haven't verified with specifications and/or browser implementations.
    while (targetIdForTimeout >= 0) {
        window.clearTimeout(targetIdForTimeout);
        targetIdForTimeout--;
    }
};

_utilsForExtract.clearAllRequestAnimationFrames = function () {
    const idForRaf1 = window.requestAnimationFrame(function () {}, 0);
    const idForRaf2 = window.requestAnimationFrame(function () {}, 0);

    // To handle scenario where window.requestAnimationFrame might have been hijacked
    let targetIdForRaf = idForRaf2 + (idForRaf2 - idForRaf1 - 1);

    // Seemingly, "targetIdForRaf > 0" would be fine, but haven't verified with specifications and/or browser implementations.
    while (targetIdForRaf >= 0) {
        window.cancelAnimationFrame(targetIdForRaf);
        targetIdForRaf--;
    }
};

_utilsForExtract.getParents = function (el, parentSelector) {
    try {
        if (parentSelector === undefined) {
            parentSelector = document;
        }
        var parents = [];
        var p = el.parentNode;
        while (p && p !== parentSelector) {
            var o = p;
            parents.push(o);
            p = o.parentNode;
        }
        parents.push(parentSelector);
        return parents;
    } catch (e) {
        console.error(e);
        debugger;
    }
};

_utilsForExtract.removeCommentNodes = function (doc) {
    const arr = Array.from(doc.all);
    for (let currentEl of arr) {
        for (let childNode of currentEl.childNodes) {
            if (childNode.nodeType === Node.COMMENT_NODE) {
                childNode.remove();
            }
        }
    }
};

_utilsForExtract.addStyle = function (cssText) {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(cssText));
    document.documentElement.appendChild(style);
};

_utilsForExtract.removeUnusedStyles = function (styleSheets, arrImportantElements) {
    for (let styleSheet of styleSheets) {
        try {
            // Somehow, for "media" style sheets (envcountered when traversing), "rules" is undefined.
            const rules = styleSheet.rules || styleSheet.cssRules;

            let arrRules;
            try {
                arrRules = Array.from(rules);
            } catch (e) {
                debugger;
            }
            for (let i = arrRules.length - 1; i >= 0; i--) {
                const rule = arrRules[i];
                const selectorText = rule.selectorText;

                // if (selectorText) {
                if (rule instanceof CSSStyleRule) {
                    const arrElements = Array.from(document.querySelectorAll(selectorText));
                    if (arrElements.length === 0) {
                        styleSheet.deleteRule(i);
                    }
                } else if (rule instanceof CSSImportRule) {
                    _utilsForExtract.removeUnusedStyles([rule.styleSheet], arrImportantElements);
                } else if (rule instanceof CSSMediaRule) {
                    if (matchMedia(rule.conditionText).matches) {
                        _utilsForExtract.removeUnusedStyles([rule], arrImportantElements);
                    } else {
                        styleSheet.deleteRule(i);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            debugger;
        }
    }
};

const doExtract = function (elToExtract) {
    const timeout = _utilsForExtract.timeout;
    const clearAllTimeoutsAndIntervals = _utilsForExtract.clearAllTimeoutsAndIntervals;
    const clearAllRequestAnimationFrames = _utilsForExtract.clearAllRequestAnimationFrames;
    const getParents = _utilsForExtract.getParents;
    const removeCommentNodes = _utilsForExtract.removeCommentNodes;
    const removeUnusedStyles = _utilsForExtract.removeUnusedStyles;

    const verbose = false;

    const hideAll = function () {
        const arr = Array.from(document.all);

        let parentsOfElToExtract = getParents(elToExtract);

        for (let currentEl of arr) {
            if (parentsOfElToExtract.includes(currentEl)) {
                // do nothing
            } else {
                let parentsOfCurrentEl = getParents(currentEl);
                if (parentsOfCurrentEl.includes(elToExtract)) {
                    // do nothing
                } else {
                    if (currentEl === elToExtract) {
                        // do nothing
                    } else {
                        currentEl.style.opacity = 0;
                    }
                }
            }
        }
    };

    let countOfElementsRemoved = 0;

    const removeAll = async function () {
        let parentsOfElToExtract = getParents(elToExtract);

        let iterationsCount = 0;

        while(true && iterationsCount < 100) {
            iterationsCount++;

            const elementsRemovedInThisIteration = [];

            const setOfElements = new Set(document.all); // Fetching the list again because while we update this Set as we remove elements, potentially an external job (eg: an ongoing Ajax request) would update the list of elements.

            for (const currentEl of setOfElements) {
                if (parentsOfElToExtract.includes(currentEl)) {
                    // do nothing
                } else {

                    let parentsOfCurrentEl = getParents(currentEl);
                    if (parentsOfCurrentEl.includes(elToExtract)) {
                        // do nothing
                    } else {
                        if (currentEl.childElementCount) {
                            // do nothing
                        } else {
                            if (currentEl === elToExtract) {
                                // do nothing
                            } else {
                                if (
                                    currentEl.nodeName === 'HEAD' ||
                                    currentEl.nodeName === 'BODY' ||
                                    currentEl.nodeName === 'STYLE' ||
                                    (currentEl.nodeName === 'LINK' && currentEl.rel === 'stylesheet')
                                ) {
                                    // do nothing
                                } else {
                                    if (currentEl.parentNode) {
                                        currentEl.remove();
                                        elementsRemovedInThisIteration.push(currentEl);
                                        countOfElementsRemoved++;
                                        if (verbose) {
                                            console.log(`Removed ${countOfElementsRemoved} elements`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const removedElement of elementsRemovedInThisIteration) {
                setOfElements.delete(removedElement);
            }
            if (elementsRemovedInThisIteration.length === 0) {
                break;
            }
        }
    };

    clearAllTimeoutsAndIntervals();
    clearAllRequestAnimationFrames();

    (async function () {
        await removeAll();
        removeCommentNodes(document);
        removeUnusedStyles(document.styleSheets);
        removeCommentNodes(document); // Doing it again because somehow some comment nodes are still left behind.
    })();
};

const _initHtmlCssExtractionUi = function () {
    const addStyle = _utilsForExtract.addStyle;

    addStyle(
`[data-_highlightedForExtraction="yes"] {
    background-color: rgba(144, 238, 145, 0.7) !important;
    color: rgb(17, 17, 17) !important;
    opacity: 0.85 !important;
    fill: red !important;
    outline: red solid 1px !important;
    border-color: orange !important;
}`
    );

    const mousemoveHandler = function (evt) {
        console.log(evt.target);
        const el = evt.target;
        document.querySelectorAll('[data-_highlightedForExtraction="yes"]').forEach(function (el) {
            el.removeAttribute('data-_highlightedForExtraction');
        });
        el.setAttribute('data-_highlightedForExtraction', 'yes');
    };
    document.documentElement.addEventListener('mousemove', mousemoveHandler, { capture: true });

    const clickHandler = function (evt) {
        document.querySelectorAll('[data-_highlightedForExtraction="yes"]').forEach(function (el) {
            el.removeAttribute('data-_highlightedForExtraction');
        });
        document.documentElement.removeEventListener('click', clickHandler, { capture: true });
        document.documentElement.removeEventListener('mousemove', mousemoveHandler, { capture: true });

        const elToExtract = evt.target;
        doExtract(elToExtract);
    };
    document.documentElement.addEventListener('click', clickHandler, { capture: true });
};

_initHtmlCssExtractionUi();
