
import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../types';

// Extend the Window interface to include VANTA
declare global {
    interface Window {
        VANTA: any;
    }
}

interface VantaBackgroundProps {
    activeTheme: Theme;
    volumes: Record<string, number>;
}

// Helper function to interpolate between two hex colors
const interpolateColor = (color1: number, color2: number, factor: number) => {
    const r1 = (color1 >> 16) & 255;
    const g1 = (color1 >> 8) & 255;
    const b1 = color1 & 255;

    const r2 = (color2 >> 16) & 255;
    const g2 = (color2 >> 8) & 255;
    const b2 = color2 & 255;

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return (r << 16) + (g << 8) + b;
};

const VantaBackground: React.FC<VantaBackgroundProps> = ({ activeTheme, volumes }) => {
    const [vantaEffect, setVantaEffect] = useState<any>(null);
    const vantaRef = useRef<HTMLDivElement>(null);

    // Initialize or change Vanta effect
    useEffect(() => {
        if (vantaEffect) {
            vantaEffect.destroy();
        }
        
        if (!window.VANTA || !activeTheme || !vantaRef.current) return;

        let newEffect: any = null;
        const effectName = activeTheme.vantaEffect;

        if (window.VANTA[effectName]) {
            let config = {};
            switch(effectName) {
                case 'WAVES': config = { mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200.00, minWidth: 200.00, scale: 1.00, scaleMobile: 1.00, color: 0x1a0b3c, shininess: 30.00, waveHeight: 15.00, waveSpeed: 0.5, zoom: 0.8 }; break;
                case 'CLOUDS': config = { mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200.00, minWidth: 200.00, skyColor: 0x2d1a59, cloudColor: 0x8a7fb0, cloudShadowColor: 0x2b1e4a, sunColor: 0xe072b0, sunGlareColor: 0xff4dba, sunlightColor: 0xff61c4, speed: 0.5 }; break;
                case 'HALO': config = { mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200.00, minWidth: 200.00, amplitudeFactor: 1.0, xOffset: 0.05, yOffset: 0.05, size: 1.0, backgroundColor: 0x0c112a, baseColor: 0x3d82a7 }; break;
            }

            newEffect = window.VANTA[effectName]({ el: vantaRef.current, ...config });
            setVantaEffect(newEffect);
        }

        return () => {
            if (newEffect) newEffect.destroy();
        };
    }, [activeTheme.vantaEffect]);


    // Update Vanta effect based on volumes
    useEffect(() => {
        if (!vantaEffect || !activeTheme) return;

        const { thunder = 0, rain = 0, forest = 0, campfire = 0, planets = 0, space_debris = 0, nasa_chatter = 0, wind_chimes = 0, crickets = 0, birds = 0, whales = 0, bubbles = 0 } = volumes;

        switch (activeTheme.vantaEffect) {
            case 'WAVES':
                const baseWaveColor = interpolateColor(0x1a0b3c, 0x080414, thunder);
                const finalWaveColor = interpolateColor(baseWaveColor, 0x4c0f3b, campfire * 0.5);
                vantaEffect.setOptions({
                    turbulence: 1.0 + thunder * 4.0 + space_debris * 2.0,
                    waveSpeed: 0.5 + rain * 1.5,
                    shininess: 30.0 + nasa_chatter * 50.0,
                    zoom: 0.8 - planets * 0.2,
                    color: finalWaveColor
                });
                break;
            case 'CLOUDS':
                 const finalCloudColor = interpolateColor(0x8a7fb0, 0x6b628a, rain);
                 const finalSunColor = interpolateColor(0xe072b0, 0xffa500, crickets * 0.5);
                 vantaEffect.setOptions({
                    speed: 0.5 + (rain * 1.0) + (wind_chimes * 0.5),
                    skyColor: interpolateColor(0x2d1a59, 0x1a3a59, forest * 0.6),
                    cloudShadowColor: interpolateColor(0x2b1e4a, 0x100c1f, thunder),
                    cloudColor: finalCloudColor,
                    sunColor: finalSunColor,
                });
                break;
            case 'HALO':
                const finalHaloColor = interpolateColor(0x3d82a7, 0x6eb1d1, birds);
                vantaEffect.setOptions({
                    amplitudeFactor: 1.0 + birds * 2.0 + bubbles * 1.0,
                    yOffset: 0.05 + thunder * 0.2 + whales * 0.1,
                    xOffset: 0.05 + rain * 0.15 + bubbles * 0.1,
                    size: 1.0 + whales * 0.75 - bubbles * 0.3,
                    baseColor: finalHaloColor
                });
                break;
        }
    }, [volumes, vantaEffect, activeTheme]);


    return (
        <div ref={vantaRef} className="fixed inset-0 w-full h-full -z-10" />
    );
};

export default VantaBackground;
