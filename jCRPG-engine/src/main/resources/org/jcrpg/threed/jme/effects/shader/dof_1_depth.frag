// "Depth of Field" demo for Ogre
// Copyright (C) 2006  Christian Lindequist Larsen
//
// This code is in the public domain. You may do whatever you want with it.

// dofParams coefficients:
// x = near blur depth; y = focal plane depth; z = far blur depth
// w = blurriness cutoff constant for objects behind the focal plane
uniform vec4 dofParams;

uniform sampler2D depthTexture; // 0
varying vec2 vTexCoord;

float LinearizeDepth(vec2 uv)
{
  float n = 0.1; // camera z near
  float f = 100.0; // camera z far
  float z = texture2D(depthTexture, uv).x;
  return (2.0 * n) / (f + n - z * (f - n));
}
void main()
{

    vec2 uv = vTexCoord;
    //float depth = texture2D(depthTexture, uv).x;
    float depth = LinearizeDepth(uv);
	float f;

	if (depth < dofParams.y)
	{
		// scale depth value between near blur distance and focal distance to
		// [-1, 0] range
		f = (depth - dofParams.y) / (dofParams.y - dofParams.x);
	}
	else
	{
		// scale depth value between focal distance and far blur distance to
		// [0, 1] range
		f = (depth - dofParams.y) / (dofParams.z - dofParams.y);
		// clamp the far blur to a maximum blurriness
		f = clamp(f, 0.0, dofParams.w);
	}

	// scale and bias into [0, 1] range
	vec4 sum = vec4(0.5*f + 0.5);
	sum.r = abs(sum.r * 2.0 - 1.0);
	if (sum.r<0.1) sum.r = 0.0;
	sum.g = sum.r;
	sum.b = sum.r;
	sum.a = 1.0;
	sum.r += 0.001; // setting r a bit higher to let dof_2 shader know this is a rendered spatial pixel, not background
	//gl_FragColor = vec4(depth,depth,depth,1.0);
	gl_FragColor = sum;

  
  //gl_FragColor = vec4(d, d, d, 1.0);

}