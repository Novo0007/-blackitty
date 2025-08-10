/**
 * This will be loaded before starting the simulator.
 * If you wish to add custom javascript, 
 * ** make sure to add this line to pxt.json**
 * 
 *      "disableTargetTemplateFiles": true
 * 
 * otherwise MakeCode will override your changes.
 * 
 * To register a constrol simmessages, use addSimMessageHandler
 */

// Performance monitoring and optimizations
const PERFORMANCE_MONITOR = {
    enabled: true,
    metrics: {},
    startTime: performance.now()
}

// Performance optimization functions
function optimizeGamePerformance() {
    // Reduce animation frame rate for better performance
    if (window.requestAnimationFrame) {
        let lastTime = 0
        const targetFPS = 60
        const frameInterval = 1000 / targetFPS
        
        const originalRAF = window.requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
            const currentTime = performance.now()
            const elapsed = currentTime - lastTime
            
            if (elapsed >= frameInterval) {
                lastTime = currentTime - (elapsed % frameInterval)
                return originalRAF(callback)
            } else {
                return setTimeout(() => {
                    lastTime = performance.now()
                    originalRAF(callback)
                }, frameInterval - elapsed)
            }
        }
    }
    
    // Optimize canvas rendering
    if (window.HTMLCanvasElement) {
        const originalGetContext = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            if (type === '2d') {
                attributes = attributes || {}
                attributes.alpha = false // Disable alpha for better performance
                attributes.antialias = false // Disable antialiasing for better performance
            }
            return originalGetContext.call(this, type, attributes)
        }
    }
}

// Performance monitoring
function startPerformanceMonitoring() {
    if (!PERFORMANCE_MONITOR.enabled) return
    
    // Monitor frame rate
    let frameCount = 0
    let lastFPSUpdate = performance.now()
    
    function updateFPS() {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastFPSUpdate >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastFPSUpdate))
            PERFORMANCE_MONITOR.metrics.fps = fps
            frameCount = 0
            lastFPSUpdate = currentTime
            
            // Log performance issues
            if (fps < 30) {
                console.warn(`Low FPS detected: ${fps}`)
            }
        }
        
        requestAnimationFrame(updateFPS)
    }
    
    requestAnimationFrame(updateFPS)
    
    // Monitor memory usage
    if (performance.memory) {
        setInterval(() => {
            PERFORMANCE_MONITOR.metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            }
        }, 5000)
    }
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    optimizeGamePerformance()
    startPerformanceMonitoring()
    
    // Add performance monitoring to window for debugging
    window.PERFORMANCE_MONITOR = PERFORMANCE_MONITOR
})

// Example of registering a sim message handler for performance monitoring
addSimMessageHandler("performance", function(data) {
    if (PERFORMANCE_MONITOR.enabled) {
        console.log("Performance data received:", data)
        PERFORMANCE_MONITOR.metrics.simData = data
    }
})
