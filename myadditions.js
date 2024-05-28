//------------------------------------------------------------------------------------
//                                MY ADDITIONS
//------------------------------------------------------------------------------------

//Moving spheres in game
var moveSpheres = function() {
    var len = spheres.length;
    for (var i = 1; i < len; i++){
      if(spheres[i]){
        spheres[i].center[2] -= Math.min(Math.random()+0.2, 0.7);
        if(checkCollision(camera_position, spheres[i])){
          spheres.splice(i,1);
          missedSpheres = 0;
          addRandomSphere();
        }
        else if(spheres[i].center[2] < camera_position[2]){
          spheres.splice(i,1);
          missedSpheres +=1;
          addRandomSphere();
        }
      }
    }
  }
  
  //Check if sphere is collected
  var checkCollision = function(camera_position, sphere) {
    var distance = Length(Subtract(camera_position, sphere.center));
    if(distance <= sphere.radius + 0.2){
      spheresCount+=1;
      document.getElementById('sphereCount').innerText = "Spheres collected : " + spheresCount;
      return true;
    }
    return false;
  }
  
  var updateColorLight = function(){
      const ambientLightColorPicker = document.getElementById('ambientLightColor').value;
      const pointLightColorPicker = document.getElementById('pointLightColor').value;
      const directionalLightColorPicker = document.getElementById('directionalLightColor').value;
  
      function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255
        };
      }
  
      amb = hexToRgb(ambientLightColorPicker);
      poi = hexToRgb(pointLightColorPicker);
      dir = hexToRgb(directionalLightColorPicker);
  
      lights[0].color[0] = amb.r;
      lights[0].color[1] = amb.g;
      lights[0].color[2] = amb.b;
      
      lights[1].color[0] = poi.r;
      lights[1].color[1] = poi.g;
      lights[1].color[2] = poi.b;
      
      lights[2].color[0] = dir.r;
      lights[2].color[1] = dir.g;
      lights[2].color[2] = dir.b;
      
      if(!startGame)
        Render();
  }
  
  document.getElementById('ambientLightColor').addEventListener('input', updateColorLight);
  document.getElementById('pointLightColor').addEventListener('input', updateColorLight);
  document.getElementById('directionalLightColor').addEventListener('input', updateColorLight);
  
  var updateLightingAndMaterial = function() {
      lights[0].intensity = parseFloat(document.getElementById('ambientLightIntensity').value);
      lights[1].intensity = parseFloat(document.getElementById('pointLightIntensity').value);
      lights[2].intensity = parseFloat(document.getElementById('directionalLightIntensity').value);
  
      if(!startGame)
        Render();
  }
  
  document.getElementById('startGame').addEventListener('click', ()=>{startGame = true; Render();});
  
  document.getElementById('ambientLightIntensity').addEventListener('input', updateLightingAndMaterial);
  document.getElementById('pointLightIntensity').addEventListener('input', updateLightingAndMaterial);
  document.getElementById('directionalLightIntensity').addEventListener('input', updateLightingAndMaterial);
  
  var resetAll = function(){
    document.getElementById('ambientLightIntensity').value = 0.2;
    document.getElementById('pointLightIntensity').value = 0.6;
    document.getElementById('directionalLightIntensity').value = 0.2;
  
    document.getElementById('reflectionDepth').value = 3;
  
    document.getElementById('sphereCount').innerText = "Spheres collected : 0";
  
    spheres = [new Sphere([0, -5001, 0], 5000, [255, 255, 0], 1000, 0.2), 
            new Sphere([0, 0, 3], 0.1, [255, 0, 0], 500, 0.2),
            new Sphere([-1, 0, 3], 0.12, [0, 255, 0], 10, 0.4),
            new Sphere([1, 0, 3], 0.19, [0, 0, 255], 500, 0.3)];
  
    recursion_depth = 3;
  
    startGame = false;
  
    spheresCount = 0;
    missedSpheres = 0;
  
    camera_position = [0, 0, 0];
  
    updateLightingAndMaterial();
  }
  
  //RESET
  document.getElementById('resetButton').addEventListener('click', function() {
      resetAll();
  });
  
  //Camera movements
  document.addEventListener('keydown', function(event) {
      switch (event.key) {
        case ' ':
          camera_position[1] += 0.25;
          break;
        case 'Control':
          camera_position[1] -= 0.25;
        break;
        case 'ArrowLeft':
          camera_position[0] -= 0.25;
          break;
        case 'ArrowRight':
          camera_position[0] += 0.25;
          break;
        case 'ArrowUp':
          if(!startGame)
            camera_position[2] += 0.25;
          break;
        case 'ArrowDown':
          if(!startGame)
            camera_position[2] -= 0.25;
          break;
        default:
          return;
      }
      if(!startGame)
        Render();
  });
  
  var addRandomSphere = function(){
    var newSphere = new Sphere(
      [camera_position[0] + Math.random() * 5 - Math.random()*4, camera_position[1], camera_position[2] + Math.random() * 30 + 5],
      Math.random() / 1.5,
      [Math.random() * 255, Math.random() * 255, Math.random() * 255],
      Math.random() * 500,
      Math.min(Math.random(), 0.5)
    );
    spheres.push(newSphere);
    if(!startGame)
      Render();
  }
  
  //Add random sphere
  document.getElementById('addSphereButton').addEventListener('click', function() {
      addRandomSphere();
  });
    
  //Remove last added sphere
  document.getElementById('removeSphereButton').addEventListener('click', function() {
      if (spheres.length > 1) {
          spheres.pop();
          if(!startGame)
            Render();
      }
  });
  
  //Control reflection depth
  document.getElementById('reflectionDepth').addEventListener('input', function(event) {
      recursion_depth = parseInt(event.target.value);
      if(!startGame)
        Render();
  });  