var canvas = document.getElementById("canvas");
var canvas_context = canvas.getContext("2d");
var canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height);
var canvas_pitch = canvas_buffer.width * 4;

var PutPixel = function(x, y, color) {
  x = canvas.width/2 + x;
  y = canvas.height/2 - y - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return;
  }

  var offset = 4*x + canvas_pitch*y;
  canvas_buffer.data[offset++] = color[0];
  canvas_buffer.data[offset++] = color[1];
  canvas_buffer.data[offset++] = color[2];
  canvas_buffer.data[offset++] = 255; // Alpha (full opacity)
}

var UpdateCanvas = function() {
  canvas_context.putImageData(canvas_buffer, 0, 0);
}

var DotProduct = function(v1, v2) {
  return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

var Length = function(vec) {
  return Math.sqrt(DotProduct(vec, vec));
}

var Multiply = function(k, vec) {
  return [k*vec[0], k*vec[1], k*vec[2]];
}

var Add = function(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

var Subtract = function(v1, v2) {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

var Clamp = function(vec) {
  return [Math.min(255, Math.max(0, vec[0])),
      Math.min(255, Math.max(0, vec[1])),
      Math.min(255, Math.max(0, vec[2]))];
}

var ReflectRay = function(v1, v2) {
    return Subtract(Multiply(2*DotProduct(v1, v2), v2), v1);
}

var Sphere = function(center, radius, color, specular, reflective) {
  this.center = center;
  this.radius = radius;
  this.color = color;
  this.specular = specular;
  this.reflective = reflective;
}

var Light = function(ltype, intensity, position, color) {
  this.ltype = ltype;
  this.intensity = intensity;
  this.position = position;
  this.color = color
}

Light.AMBIENT = 0;
Light.POINT = 1;
Light.DIRECTIONAL = 2;

var viewport_size = 1;
var projection_plane_z = 1;
var camera_position = [0, 0, 0];
var background_color = [0, 255, 255];
var spheres = [new Sphere([0, -5001, 0], 5000, [255, 255, 0], 1000, 0.2), 
              new Sphere([0, 0, 3], 0.1, [255, 0, 0], 500, 0.2),
              new Sphere([-1, 0, 3], 0.12, [0, 255, 0], 10, 0.4),
              new Sphere([1, 0, 3], 0.19, [0, 0, 255], 500, 0.3)];

var lights = [
  new Light(Light.AMBIENT, 0.2, null, [255, 255, 255]),
  new Light(Light.POINT, 0.6, [2, 1, 0], [255, 255, 255]),
  new Light(Light.DIRECTIONAL, 0.2, [1, 4, 4], [255, 255, 255])
];

var CanvasToViewport = function(p2d) {
  return [p2d[0] * viewport_size / canvas.width,
      p2d[1] * viewport_size / canvas.height,
      projection_plane_z];
}

var recursion_depth = 3;

// Computes the intersection of a ray and a sphere
var IntersectRaySphere = function(origin, direction, sphere) {
  var oc = Subtract(origin, sphere.center);

  var k1 = DotProduct(direction, direction);
  var k2 = 2*DotProduct(oc, direction);
  var k3 = DotProduct(oc, oc) - sphere.radius*sphere.radius;

  var discriminant = k2*k2 - 4*k1*k3;
  if (discriminant < 0) {
    return [Infinity, Infinity];
  }

  var t1 = (-k2 + Math.sqrt(discriminant)) / (2*k1);
  var t2 = (-k2 - Math.sqrt(discriminant)) / (2*k1);
  return [t1, t2];
}

var ComputeLighting = function(point, normal, view, specular) {
  var intensity = { r: 0, g: 0, b: 0 };
  var length_n = Length(normal);
  var length_v = Length(view);

  for (var i = 0; i < lights.length; i++) {
    var light = lights[i];
    var lightColor = light.color;

    if (light.ltype == Light.AMBIENT) { //Light.AMBIENT
        intensity.r += light.intensity * lightColor[0];
        intensity.g += light.intensity * lightColor[1];
        intensity.b += light.intensity * lightColor[2];
    } 
    else {
        var vec_l, t_max;
        if (light.ltype == Light.POINT) { //Light.POINT
            vec_l = Subtract(light.position, point);
            t_max = 1.0;
        } 
        else { //Light.DIRECTIONAL
            vec_l = light.position;
            t_max = Infinity;
        }

        // Shadows
        var blocker = ClosestIntersection(point, vec_l, EPSILON, t_max);
        if (blocker) {
            continue;
        }

        // Diffuse reflection.
        var n_dot_l = DotProduct(normal, vec_l);
        if (n_dot_l > 0) {
            var diffuseFactor = light.intensity * n_dot_l / (length_n * Length(vec_l));
            intensity.r += diffuseFactor * lightColor[0];
            intensity.g += diffuseFactor * lightColor[1];
            intensity.b += diffuseFactor * lightColor[2];
        }

        // Specular reflection.
        if (specular != -1) {
            var vec_r = Subtract(Multiply(2.0 * DotProduct(normal, vec_l), normal), vec_l);
            var r_dot_v = DotProduct(vec_r, view);
            if (r_dot_v > 0) {
                var specularFactor = light.intensity * Math.pow(r_dot_v / (Length(vec_r) * length_v), specular);
                intensity.r += specularFactor * lightColor[0];
                intensity.g += specularFactor * lightColor[1];
                intensity.b += specularFactor * lightColor[2];
            }
        }
    }
  }

  //Clamping
  intensity.r = Math.min(1, Math.max(0, intensity.r/255.));
  intensity.g = Math.min(1, Math.max(0, intensity.g/255.));
  intensity.b = Math.min(1, Math.max(0, intensity.b/255.));

  return intensity;
}



// Find the closest intersection between a ray and the spheres in the scene.
var ClosestIntersection = function(origin, direction, min_t, max_t) {
  var closest_t = Infinity;
  var closest_sphere = null;

  for (var i = 0; i < spheres.length; i++) {
    var ts = IntersectRaySphere(origin, direction, spheres[i]);
    if (ts[0] < closest_t && min_t < ts[0] && ts[0] < max_t) {
      closest_t = ts[0];
      closest_sphere = spheres[i];
    }
    if (ts[1] < closest_t && min_t < ts[1] && ts[1] < max_t) {
      closest_t = ts[1];
      closest_sphere = spheres[i];
    }
  }

  if (closest_sphere) {
    return [closest_sphere, closest_t];
  }
  return null;
}


// Traces a ray against the set of spheres in the scene.
var TraceRay = function(origin, direction, min_t, max_t, depth) {
  var intersection = ClosestIntersection(origin, direction, min_t, max_t);
  if (!intersection) {
    return background_color;
  }

  var closest_sphere = intersection[0];
  var closest_t = intersection[1];

  var point = Add(origin, Multiply(closest_t, direction));
  var normal = Subtract(point, closest_sphere.center);
  normal = Multiply(1.0 / Length(normal), normal);

  var view = Multiply(-1, direction);
  var lighting = ComputeLighting(point, normal, view, closest_sphere.specular);
  
  var local_color = [lighting.r * closest_sphere.color[0], lighting.g * closest_sphere.color[1], lighting.b * closest_sphere.color[2]]

  if (closest_sphere.reflective <= 0 || depth <= 0) {
    return local_color;
  }

  var reflected_ray = ReflectRay(view, normal);
  var reflected_color = TraceRay(point, reflected_ray, EPSILON, Infinity, depth - 1);

  return Add(Multiply(1 - closest_sphere.reflective, local_color),
         Multiply(closest_sphere.reflective, reflected_color));
}

var EPSILON = 0.001;
var SetShadowEpsilon = function(epsilon) {
  EPSILON = epsilon;
  Render();
}

var startGame = false;
var spheresCount = 0;
var missedSpheres = 0;
var highScore = 0;

var Render = function() {
    if(startGame){
      moveSpheres();
    }
    for (var x = -canvas.width/2; x < canvas.width/2; x++) {
      for (var y = -canvas.height/2; y < canvas.height/2; y++) {
        var direction = CanvasToViewport([x, y])
        var color = TraceRay(camera_position, direction, 1, Infinity, recursion_depth);
        PutPixel(x, y, Clamp(color));
      }
    }
    UpdateCanvas();
    if(missedSpheres > 4){
      alert("Game over, you missed 5 spheres in a row!");
      if(spheresCount <= highScore){
        alert("Your score is: " + spheresCount);
      }
      else{
        alert("New highscore: " + spheresCount);
        document.getElementById('highscore').innerText = "Highscore : " + spheresCount;
      }
      resetAll();
      return;
    }
    if(startGame)
      setTimeout(Render, 0);
  }

Render();