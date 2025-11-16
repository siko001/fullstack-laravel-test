export function setupHitwalls(svgElements) {
    svgElements?.forEach((el) => {
        if (!el.hasAttribute("data-original-stroke")) {
            const hitArea = el.cloneNode(true);
            hitArea.setAttribute("class", "hit-area");
            hitArea.setAttribute("data-hit-area-for", el.id);
            
            hitArea.querySelectorAll('*').forEach((child) => {
                if (child.tagName === 'line' || child.tagName === 'path') {
                    child.setAttribute('stroke', 'transparent');
                    child.setAttribute('fill', 'transparent');
                    child.setAttribute('stroke-width', '10'); 
                    child.style.vectorEffect = 'non-scaling-stroke';
                }
            });
            hitArea.style.pointerEvents = 'all';
            hitArea.style.cursor = 'pointer';
            hitArea.setAttribute('data-original-id', el.id);
            
            el.parentNode.insertBefore(hitArea, el);
        }
    });
}


export function keyHandler() {
    let lastAltTime = 0;
    let persistentMode = false;
    
    const handleKeyDown = (e) => {
        if (e.altKey) {
            document.body.classList.add('show-hit-areas');
        }
    };
    
    const handleKeyUp = (e) => {
        if (!e.altKey) {
            const currentTime = Date.now();
            if (currentTime - lastAltTime < 300) {
                persistentMode = !persistentMode;
                if (persistentMode) {
                    document.body.classList.add('show-hit-areas');
                } else {
                    document.body.classList.remove('show-hit-areas');
                }
            }
            lastAltTime = currentTime;
            
            if (!persistentMode) {
                document.body.classList.remove('show-hit-areas');
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        document.body.classList.remove('show-hit-areas');
    };
}
