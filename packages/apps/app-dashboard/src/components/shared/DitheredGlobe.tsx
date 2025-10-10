import { useEffect, useRef, useState, memo } from 'react';
import Globe from 'react-globe.gl';
import * as topojson from 'topojson-client';
import * as THREE from 'three';

const getCSSVariable = (variable: string): string => {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

const majorCities = [
  { lat: 40.7128, lng: -74.006, name: 'New York', continent: 'NA' },
  { lat: 51.5074, lng: -0.1278, name: 'London', continent: 'EU' },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo', continent: 'AS' },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney', continent: 'OC' },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore', continent: 'AS' },
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco', continent: 'NA' },
  { lat: 52.52, lng: 13.405, name: 'Berlin', continent: 'EU' },
  { lat: 19.076, lng: 72.8777, name: 'Mumbai', continent: 'AS' },
  { lat: -23.5505, lng: -46.6333, name: 'São Paulo', continent: 'SA' },
  { lat: 25.2048, lng: 55.2708, name: 'Dubai', continent: 'AS' },
  { lat: -26.2041, lng: 28.0473, name: 'Johannesburg', continent: 'AF' },
  { lat: 55.7558, lng: 37.6173, name: 'Moscow', continent: 'EU' },
  { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires', continent: 'SA' },
  { lat: 22.3193, lng: 114.1694, name: 'Hong Kong', continent: 'AS' },
  { lat: -37.8136, lng: 144.9631, name: 'Melbourne', continent: 'OC' },
];

// Seeded random number generator for consistent arcs
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number) {
    return Math.floor(this.next() * max);
  }
}

const generateArcs = () => {
  const newArcs = [];
  const numArcs = 20;
  const connectedPairs = new Set<string>();
  const random = new SeededRandom(42); // Fixed seed for consistency

  // Ensure at least some long-distance intercontinental arcs
  let attempts = 0;
  while (newArcs.length < numArcs && attempts < numArcs * 5) {
    const start = majorCities[random.nextInt(majorCities.length)];
    let end = majorCities[random.nextInt(majorCities.length)];

    // For first 10 arcs, prefer different continents
    if (newArcs.length < 10) {
      let continentAttempts = 0;
      while (start.continent === end.continent && continentAttempts < 10) {
        end = majorCities[random.nextInt(majorCities.length)];
        continentAttempts++;
      }
    }

    if (start !== end) {
      // Create a consistent pair key (sorted to catch both directions)
      const pairKey = [start.name, end.name].sort().join('-');

      if (!connectedPairs.has(pairKey)) {
        connectedPairs.add(pairKey);
        newArcs.push({
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
          color: '#FF4205',
        });
      }
    }

    attempts++;
  }

  return newArcs;
};

function DitheredGlobe() {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState({ features: [] });
  const [hasError, setHasError] = useState(false);
  const instancedMeshesRef = useRef<{
    base?: THREE.InstancedMesh;
    border?: THREE.InstancedMesh;
    arcDots?: THREE.InstancedMesh;
  }>({});
  const [arcs] = useState<any[]>(generateArcs());
  const animationRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });
  const [themeColors, setThemeColors] = useState(() => ({
    globeBg: getCSSVariable('--globe-bg') || '#ffffff',
    globeDots: getCSSVariable('--globe-dots') || '#000000',
  }));

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Watch for theme changes via MutationObserver on the html class
    const updateThemeColors = () => {
      setThemeColors({
        globeBg: getCSSVariable('--globe-bg') || '#ffffff',
        globeDots: getCSSVariable('--globe-dots') || '#000000',
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Auto-rotate
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false;

      // Center the globe properly
      if (globeEl.current.pointOfView) {
        globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
      }

      // Position camera to center the globe (higher z = smaller globe, negative y = move globe down)
      const camera = globeEl.current.camera();
      camera.position.set(0, -60, 350);
      camera.lookAt(0, 0, 0);
    }

    // Load country data from local file
    fetch('/data/countries-110m.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch country data');
        return res.json();
      })
      .then((data) => {
        // Convert TopoJSON to GeoJSON
        const countriesGeo = topojson.feature(data, data.objects.countries) as any;
        setCountries(countriesGeo);
      })
      .catch((error) => {
        console.error('Error loading globe data:', error);
        setHasError(true);
      });
  }, []);

  useEffect(() => {
    if (countries.features.length === 0 || !globeEl.current) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    const baseDots = generateBaseDots();
    const borderDots = generateBorderDots();

    // Create instanced meshes for better performance
    createInstancedMeshes(baseDots, borderDots);
  }, [countries, arcs, themeColors]);

  // Generate vertical lines of dots from top to bottom
  const generateBaseDots = () => {
    const dots = [];
    const numLines = 80; // Number of vertical lines around the sphere
    const dotsPerLine = 60; // Number of dots per vertical line

    for (let i = 0; i < numLines; i++) {
      const lng = (i / numLines) * 360 - 180;

      for (let j = 0; j < dotsPerLine; j++) {
        const lat = (j / dotsPerLine) * 180 - 90;

        dots.push({
          lat,
          lng,
          size: 0.15,
          color: '#9ca3af', // Gray dots
        });
      }
    }

    return dots;
  };

  // Generate orange dots along country borders
  const generateBorderDots = () => {
    const dots: any[] = [];

    countries.features.forEach((feature: any) => {
      const coords = feature.geometry.coordinates;

      const processCoords = (coordsArray: any) => {
        coordsArray.forEach((ring: any) => {
          if (Array.isArray(ring[0]) && typeof ring[0][0] === 'number') {
            // This is a coordinate array - use all points for maximum density
            for (let i = 0; i < ring.length; i++) {
              dots.push({
                lng: ring[i][0],
                lat: ring[i][1],
                size: 0.12,
                color: '#f97316', // Orange
              });
            }
          } else {
            // Nested array, recurse
            processCoords(ring);
          }
        });
      };

      if (feature.geometry.type === 'Polygon') {
        processCoords(coords);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords.forEach((polygon: any) => processCoords(polygon));
      }
    });

    return dots;
  };

  const createInstancedMeshes = (baseDots: any[], borderDots: any[]) => {
    if (!globeEl.current?.scene) {
      console.warn('Globe scene not available');
      return;
    }
    const scene = globeEl.current.scene();
    const GLOBE_RADIUS = 100;

    // Calculate animation speed based on viewport size
    const viewportHeight = Math.min(dimensions.height, window.innerHeight);
    const effectiveSize = Math.min(dimensions.width, viewportHeight);
    const scale = Math.max(0.6, Math.min(1, effectiveSize / 900));
    const animationSpeed = 0.0005 * scale; // Slower on smaller screens

    // Remove old meshes
    if (instancedMeshesRef.current.base) {
      scene.remove(instancedMeshesRef.current.base);
      instancedMeshesRef.current.base.geometry.dispose();
      (instancedMeshesRef.current.base.material as THREE.Material).dispose();
    }
    if (instancedMeshesRef.current.border) {
      scene.remove(instancedMeshesRef.current.border);
      instancedMeshesRef.current.border.geometry.dispose();
      (instancedMeshesRef.current.border.material as THREE.Material).dispose();
    }
    if (instancedMeshesRef.current.arcDots) {
      scene.remove(instancedMeshesRef.current.arcDots);
      instancedMeshesRef.current.arcDots.geometry.dispose();
      (instancedMeshesRef.current.arcDots.material as THREE.Material).dispose();
    }

    // Helper to convert lat/lng to 3D position
    const latLngToVector3 = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      );
    };

    // Create base dots instanced mesh
    const baseGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: themeColors.globeDots });
    const baseMesh = new THREE.InstancedMesh(baseGeometry, baseMaterial, baseDots.length);

    baseDots.forEach((dot, i) => {
      const position = latLngToVector3(dot.lat, dot.lng, GLOBE_RADIUS);
      const matrix = new THREE.Matrix4();
      matrix.setPosition(position);
      baseMesh.setMatrixAt(i, matrix);
    });
    baseMesh.instanceMatrix.needsUpdate = true;

    // Create border dots instanced mesh
    const borderGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const borderMaterial = new THREE.MeshBasicMaterial({ color: '#FF4205' });
    const borderMesh = new THREE.InstancedMesh(borderGeometry, borderMaterial, borderDots.length);

    borderDots.forEach((dot, i) => {
      const position = latLngToVector3(dot.lat, dot.lng, GLOBE_RADIUS);
      const matrix = new THREE.Matrix4();
      matrix.setPosition(position);
      borderMesh.setMatrixAt(i, matrix);
    });
    borderMesh.instanceMatrix.needsUpdate = true;

    // Create arc dots - dots that travel along arc paths
    // Calculate total dots needed based on arc lengths
    const arcInfos: {
      curve: THREE.QuadraticBezierCurve3;
      offset: number;
      numDots: number;
      startIndex: number;
    }[] = [];
    let totalArcDots = 0;

    arcs.forEach((arc) => {
      const start = latLngToVector3(arc.startLat, arc.startLng, GLOBE_RADIUS);
      const end = latLngToVector3(arc.endLat, arc.endLng, GLOBE_RADIUS);

      // Calculate distance and determine dots based on arc length
      const distance = start.distanceTo(end);
      const dotsPerArc = Math.floor(Math.max(30, (distance / 8) * 2.5)); // Min 30 dots, 2.5 dots per 8 units

      // Calculate midpoint for arc curve (higher altitude for arc effect)
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      // Better altitude scaling: use square root for more balanced arcs, with a max cap
      const MAX_ALTITUDE = 50;
      const altitude = Math.min(Math.sqrt(distance) * 8, MAX_ALTITUDE);
      midPoint.normalize().multiplyScalar(GLOBE_RADIUS + altitude);

      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);

      arcInfos.push({
        curve,
        offset: Math.random(),
        numDots: dotsPerArc,
        startIndex: totalArcDots,
      });

      totalArcDots += dotsPerArc;
    });

    const arcDotGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const arcDotMaterial = new THREE.MeshBasicMaterial({ color: '#FF4205' });
    const arcDotsMesh = new THREE.InstancedMesh(arcDotGeometry, arcDotMaterial, totalArcDots);

    // Initially place dots along the curves
    arcInfos.forEach(({ curve, numDots, startIndex }) => {
      for (let i = 0; i < numDots; i++) {
        const t = (i / numDots) % 1;
        const position = curve.getPoint(t);
        const matrix = new THREE.Matrix4();
        matrix.setPosition(position);
        arcDotsMesh.setMatrixAt(startIndex + i, matrix);
      }
    });
    arcDotsMesh.instanceMatrix.needsUpdate = true;

    // Add to scene
    scene.add(baseMesh);
    scene.add(borderMesh);
    scene.add(arcDotsMesh);

    instancedMeshesRef.current = { base: baseMesh, border: borderMesh, arcDots: arcDotsMesh };

    // Animate arc dots
    let animationTime = 0;

    const animate = () => {
      animationTime += animationSpeed; // Responsive animation speed

      // Animate arc dots
      arcInfos.forEach(({ curve, offset, numDots, startIndex }) => {
        for (let i = 0; i < numDots; i++) {
          const t = (animationTime + offset + i / numDots) % 1;
          const position = curve.getPoint(t);
          const matrix = new THREE.Matrix4();
          matrix.setPosition(position);
          arcDotsMesh.setMatrixAt(startIndex + i, matrix);
        }
      });
      arcDotsMesh.instanceMatrix.needsUpdate = true;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Don't render if there was an error or if window is not available
  if (hasError || typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none opacity-50">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl=""
        showAtmosphere={false}
        globeMaterial={
          new THREE.MeshBasicMaterial({
            color: themeColors.globeBg,
            opacity: 1,
          })
        }
      />
    </div>
  );
}

export default memo(DitheredGlobe);
