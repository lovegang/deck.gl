// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

export default `\

attribute vec2 vertexPositions;
attribute float vertexValid;

uniform bool extruded;
uniform bool isWireframe;
uniform float elevationScale;
uniform float opacity;

varying vec4 vColor;
varying float isValid;

struct PolygonProps {
  vec4 fillColors;
  vec4 lineColors;
  vec3 positions;
  vec3 nextPositions;
  vec3 pickingColors;
  vec2 positions64xyLow;
  vec2 nextPositions64xyLow;
  float elevations;
};

void calculatePosition(PolygonProps props) {
  vec3 pos;
  vec2 pos64xyLow;
  vec3 normal;
  vec4 colors = isWireframe ? props.lineColors : props.fillColors;

#ifdef IS_SIDE_VERTEX
  pos = mix(props.positions, props.nextPositions, vertexPositions.x);
  pos64xyLow = mix(props.positions64xyLow, props.nextPositions64xyLow, vertexPositions.x);
  isValid = vertexValid;
#else
  pos = props.positions;
  pos64xyLow = props.positions64xyLow;
  isValid = 1.0;
#endif

  if (extruded) {
    pos.z += props.elevations * vertexPositions.y * elevationScale;
  }

  vec4 position_commonspace;
  gl_Position = project_position_to_clipspace(pos, pos64xyLow, vec3(0.), position_commonspace);

  if (extruded) {
#ifdef IS_SIDE_VERTEX
    normal = vec3(props.positions.y - props.nextPositions.y, props.nextPositions.x - props.positions.x, 0.0);
    normal = project_normal(normal);
#else
    normal = vec3(0.0, 0.0, 1.0);
#endif

    vec3 lightColor = lighting_getLightColor(colors.rgb, project_uCameraPosition, position_commonspace.xyz, normal);
    vColor = vec4(lightColor, colors.a * opacity) / 255.0;
  } else {
    vColor = vec4(colors.rgb, colors.a * opacity) / 255.0;
  }

  // Set color to be rendered to picking fbo (also used to check for selection highlight).
  picking_setPickingColor(props.pickingColors);
}
`;
