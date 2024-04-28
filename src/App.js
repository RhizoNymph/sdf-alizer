import React, { useEffect, useRef, useState } from 'react';
import Split from '@uiw/react-split';
import * as THREE from 'three';

function App() {
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [isBottomPanelVisible, setIsBottomPanelVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
        return;
      }

      switch (event.key.toUpperCase()) {
        case 'L':
          setIsLeftSidebarVisible(prev => !prev);
          break;
        case 'R':
          setIsRightSidebarVisible(prev => !prev);
          break;
        case 'B':
          setIsBottomPanelVisible(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const mountRef = useRef(null);
  
  const [sdfCode, setSdfCode] = useState(`
    function sdfFunction(x, y, z) {
      // Example: Torus SDF
      const radius = 1;
      const thickness = 0.5;
      const d = Math.sqrt(x * x + y * y) - radius;
      return Math.sqrt(d * d + z * z) - thickness;
    }
  `);

  // Local state to hold the temporary SDF code input
  const [tempSdfCode, setTempSdfCode] = useState(sdfCode);

  // Handle SDF code change temporarily
  const handleTempSdfCodeChange = (event) => {
    setTempSdfCode(event.target.value);
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    setSdfCode(tempSdfCode); // Update the actual sdfCode state on submit
  };


  // Function to generate mesh points using the SDF function
  function generateMeshPoints(sdf, step) {
    const points = [];
    const min = -2;
    const max = 2;
    for (let x = min; x < max; x += step) {
      for (let y = min; y < max; y += step) {
        for (let z = min; z < max; z += step) {
          const value = sdf(x, y, z);
          if (Math.abs(value) < step) {
            points.push(new THREE.Vector3(x, y, z));
          }
        }
      }
    }
    return points;
  }

  // Handle SDF code change
  const handleSdfCodeChange = (event) => {
    setSdfCode(event.target.value);
  };
  useEffect(() => {
    // Set up the Three.js scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer();
    mountRef.current.appendChild(renderer.domElement);
  
    let mesh;
  
    // Function to update the mesh based on the SDF code
    const updateMesh = () => {
      // Remove the previous mesh from the scene
      if (mesh) {
        scene.remove(mesh);
      }
  
      // Evaluate the SDF function from the user input
      const sdfFunction = new Function('x', 'y', 'z', `return (${sdfCode})(x, y, z)`);
  
      // Generate the mesh geometry using the SDF function
      const meshPoints = generateMeshPoints(sdfFunction, 0.05);
      const geometry = new THREE.BufferGeometry();
      geometry.setFromPoints(meshPoints);
  
      // Create a material and mesh
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
  
      // Adjust the camera and renderer based on the mesh size
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      camera.position.z = maxSize * 2;
      renderer.setSize(mountRef.current.offsetWidth, mountRef.current.offsetHeight);
    };
  
    // Initial mesh update
    updateMesh();
  
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
  
      // Rotate the mesh
      if (mesh) {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      }
  
      // Render the scene
      renderer.render(scene, camera);
    };
  
    // Start the animation loop
    animate();
  
    // Handle window resize
    const handleResize = () => {
      if (mountRef.current) {
        const container = mountRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
  
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerWidth, containerHeight);
  
        updateMesh();
      }
    };
  
    window.addEventListener('resize', handleResize);
  
    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [sdfCode, isLeftSidebarVisible, isRightSidebarVisible, isBottomPanelVisible]);
  
  return (
    <div className="app">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
        <button onClick={() => setIsLeftSidebarVisible(!isLeftSidebarVisible)}>L</button>
        <button onClick={() => setIsRightSidebarVisible(!isRightSidebarVisible)}>R</button>
        <button onClick={() => setIsBottomPanelVisible(!isBottomPanelVisible)}>B</button>
      </div>
      <Split
        mode="horizontal"
        style={{ height: 'calc(100vh - 40px)', width: '100%', backgroundColor: '#A890D3' }}
      >
        <div
          className="left-sidebar"
          style={{
            display: isLeftSidebarVisible ? 'block' : 'none',
            minWidth: '220px',
            flexBasis: '220px',
            flexShrink: 0,
          }}
        >
          <form onSubmit={handleSubmit}>
            <textarea
              value={tempSdfCode}
              onChange={handleTempSdfCodeChange}
              rows={10}
              cols={50}
              style={{ marginTop: '20px' }}
            />
            <button type="submit" style={{ marginTop: '10px' }}>
              Render
            </button>
          </form>
        </div>
        <Split
          mode="vertical"
          style={{
            flexGrow: 1,
            backgroundColor: '#A890D3',
            position: 'relative',
          }}
        >
          <div
            className="main-content"
            ref={mountRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: isBottomPanelVisible ? '40px' : 0,
            }}
          />
          <div
            className="bottom-panel"
            style={{
              display: isBottomPanelVisible ? 'block' : 'none',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '40px',
            }}
          >
            Bottom Panel Content
          </div>
        </Split>
        <div
          className="right-sidebar"
          style={{
            display: isRightSidebarVisible ? 'block' : 'none',
            minWidth: '220px',
            flexBasis: '220px',
            flexShrink: 0,
          }}
        >
          Right Sidebar Content
        </div>
      </Split>
    </div>
  );
}

export default App;