/*
 * Copyright (c) 2003-2009 jMonkeyEngine
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * * Neither the name of 'jMonkeyEngine' nor the names of its contributors
 *   may be used to endorse or promote products derived from this software
 *   without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package org.jcrpg.threed.engine.effects;

import java.io.IOException;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.ardor3d.extension.effect.bloom.BloomRenderPass;
import com.ardor3d.extension.effect.water.WaterNode;
import com.ardor3d.image.Texture;
import com.ardor3d.image.Texture2D;
import com.ardor3d.image.TextureStoreFormat;
import com.ardor3d.math.ColorRGBA;
import com.ardor3d.math.Matrix4;
import com.ardor3d.math.Plane;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.Vector4;
import com.ardor3d.math.type.ReadOnlyVector3;
import com.ardor3d.renderer.Camera;
import com.ardor3d.renderer.ContextCapabilities;
import com.ardor3d.renderer.ContextManager;
import com.ardor3d.renderer.Renderer;
import com.ardor3d.renderer.TextureRenderer;
import com.ardor3d.renderer.TextureRendererFactory;
import com.ardor3d.renderer.pass.Pass;
import com.ardor3d.renderer.queue.RenderBucketType;
import com.ardor3d.renderer.state.BlendState;
import com.ardor3d.renderer.state.ClipState;
import com.ardor3d.renderer.state.CullState;
import com.ardor3d.renderer.state.FogState;
import com.ardor3d.renderer.state.GLSLShaderObjectsState;
import com.ardor3d.renderer.state.TextureState;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.Spatial;
import com.ardor3d.scenegraph.hint.CullHint;
import com.ardor3d.scenegraph.hint.LightCombineMode;
import com.ardor3d.scenegraph.shape.Quad;
import com.ardor3d.util.TextureManager;

/**
 * <code>WaterRenderPass</code>
 * Water effect pass.
 *
 * @author Rikard Herlitz (MrCoder)
 * @version $Id: WaterRenderPass.java 4133 2009-03-19 20:40:11Z blaine.dev $
 */
public class WaterRenderPass extends Pass {
    private static final Logger logger = Logger.getLogger(WaterRenderPass.class
            .getName());
    
    private static final long serialVersionUID = 1L;

    protected Camera cam;
    protected double tpf;
    protected float reflectionThrottle = 1/50f, refractionThrottle = 1/50f;
    protected float reflectionTime = 0, refractionTime = 0;
    protected boolean useFadeToFogColor = false;

	protected TextureRenderer tRenderer;
	protected Texture2D textureReflect;
	protected Texture2D textureRefract;
	protected Texture2D textureDepth;

	protected ArrayList<Spatial> renderList;
	protected ArrayList<Texture> texArray = new ArrayList<Texture>();
	protected Node skyBox;

	protected GLSLShaderObjectsState waterShader;
	protected CullState cullBackFace;
	protected TextureState textureState;
	protected TextureState fallbackTextureState;
	
    private Texture normalmapTexture;
    private Texture dudvTexture;
    private Texture foamTexture;
    private Texture fallbackTexture;
	
	protected BlendState as1;
	protected ClipState clipState;
	protected FogState noFog;

	protected Plane waterPlane;
	protected Vector3 tangent;
	protected Vector3 binormal;
	protected Vector3 calcVect = new Vector3();
	protected float clipBias;
	protected ColorRGBA waterColorStart;
	protected ColorRGBA waterColorEnd;
	protected float heightFalloffStart;
	protected float heightFalloffSpeed;
	protected float waterMaxAmplitude;
	protected float speedReflection;
	protected float speedRefraction;

	protected boolean aboveWater;
	protected float normalTranslation = 0.0f;
	protected float refractionTranslation = 0.0f;
	protected boolean supported = true;
	protected boolean useProjectedShader = false;
	protected boolean useRefraction = false;
	protected boolean useReflection = true;
	protected int renderScale;

    protected String simpleShaderStr = "com/ardor3d/extension/effect/water/flatwatershader";
    protected String simpleShaderRefractionStr = "com/ardor3d/extension/effect/water/flatwatershader_refraction";
    protected String projectedShaderStr = "com/ardor3d/extension/effect/water/projectedwatershader";
    protected String projectedShaderRefractionStr = "com/ardor3d/extension/effect/water/projectedwatershader_refraction";
	protected String currentShaderStr;

    public static String normalMapTextureString = "normalmap3.dds";
    public static String dudvMapTextureString = "dudvmap.png";
    public static String foamMapTextureString = "oceanfoam.png";
    public static String fallbackMapTextureString = "water2.png";

    
    private GLSLShaderObjectsState blurShaderVertical = new GLSLShaderObjectsState();
    private float blurSampleDistance = 0.002f;
    private Quad fullScreenQuad = null;
    private boolean doBlurReflection = true;

    /**
     * Resets water parameters to default values
     *
     */
    public void resetParameters() {
		waterPlane = new Plane( new Vector3( 0.0f, 1.0f, 0.0f ), 0.0f );
		tangent = new Vector3( 1.0f, 0.0f, 0.0f );
		binormal = new Vector3( 0.0f, 0.0f, 1.0f );

		waterMaxAmplitude = 1.0f;
		clipBias = 0.0f;
		waterColorStart = new ColorRGBA( 0.0f, 0.0f, 0.1f, 1.0f );
		waterColorEnd = new ColorRGBA( 0.0f, 0.3f, 0.1f, 1.0f );
		heightFalloffStart = 300.0f;
		heightFalloffSpeed = 500.0f;
		speedReflection = 0.1f;
		speedRefraction = -0.05f;
	}

	/**
	 * Release pbuffers in TextureRenderer's. Preferably called from user cleanup method.
	 */
	public void cleanup() {
		if( isSupported() )
			tRenderer.cleanup();
	}

	public boolean isSupported() {
		return supported;
	}

	/**
	 * Creates a new WaterRenderPass
	 *
	 * @param cam				main rendercam to use for reflection settings etc
	 * @param renderScale		how many times smaller the reflection/refraction textures should be compared to the main display
	 * @param useProjectedShader true - use the projected setup for variable height water meshes, false - use the flast shader setup
	 * @param useRefraction	  enable/disable rendering of refraction textures
	 */
	public WaterRenderPass( Camera cam, int renderScale, boolean useProjectedShader, boolean useRefraction ) {
		this.cam = cam;
		this.useProjectedShader = useProjectedShader;
        this.useRefraction = useRefraction;
		this.renderScale = renderScale;
		resetParameters();
//		initialize();
	}

	boolean initialized = false;
	private void initialize(final Renderer r) {
        if (cam == null || initialized) {
            return;
        }
        initialized = true;

		/*if( useRefraction && useProjectedShader && TextureState.getNumberOfFragmentUnits() < 6 ||
			useRefraction && TextureState.getNumberOfFragmentUnits() < 5 ) {
			useRefraction = false;
			logger.info("Not enough textureunits, falling back to non refraction water");
		}

		DisplaySystem display = DisplaySystem.getDisplaySystem();

		if( !GLSLShaderObjectsState.isSupported() ) {
			supported = false;
		}
*/
        final ContextCapabilities caps = ContextManager.getCurrentContext().getCapabilities();

        if (useRefraction && useProjectedShader && caps.getNumberOfFragmentTextureUnits() < 6 || useRefraction
                && caps.getNumberOfFragmentTextureUnits() < 5) {
            useRefraction = false;
            logger.info("Not enough textureunits, falling back to non refraction water");
        }

        if (!caps.isGLSLSupported()) {
            supported = false;
        }
        if (!(caps.isPbufferSupported() || caps.isFBOSupported())) {
            supported = false;
        }

        waterShader = new GLSLShaderObjectsState();

		cullBackFace = new CullState();//display.getRenderer().createCullState();
		cullBackFace.setEnabled( true );
		cullBackFace.setCullFace( CullState.Face.None );
		clipState = new ClipState();//.getRenderer().createClipState();
		if( isSupported() ) {
			tRenderer = TextureRendererFactory.INSTANCE.createTextureRenderer(
					    cam.getWidth() / renderScale,
                        cam.getHeight() / renderScale,
                        8, // Depth bits... TODO: Make configurable?
                        0, // Samples... TODO: Make configurable?
                        r, caps);

               tRenderer.setMultipleTargets(true);
				tRenderer.setBackgroundColor( new ColorRGBA( 0.0f, 0.0f, 0.0f, 1.0f ) );
				tRenderer.getCamera().setFrustum( cam.getFrustumNear(), cam.getFrustumFar(), cam.getFrustumLeft(), cam.getFrustumRight(), cam.getFrustumTop(), cam.getFrustumBottom() );

				textureState = new TextureState();
				textureState.setEnabled( true );

				setupTextures();
		}

		if( !isSupported() ) {
		    createFallbackData();
		} else {
            noFog = new FogState();
            noFog.setEnabled(false);      
        }
	}

    protected void setupTextures() {
        textureReflect = new Texture2D();
        textureReflect.setWrap(Texture.WrapMode.EdgeClamp);
        textureReflect.setMagnificationFilter( Texture.MagnificationFilter.Bilinear );
        Matrix4 matrix = new Matrix4();
        matrix.setValue(0, 0, -1.0);
        matrix.setValue(3, 0, 1.0);
        textureReflect.setTextureMatrix(matrix);
        tRenderer.setupTexture( textureReflect );

        normalmapTexture = TextureManager.load(normalMapTextureString, Texture.MinificationFilter.Trilinear,
                TextureStoreFormat.GuessCompressedFormat, true);
        textureState.setTexture( normalmapTexture, 0 );
        normalmapTexture.setWrap(Texture.WrapMode.Repeat);

        textureState.setTexture( textureReflect, 1 );

        dudvTexture = TextureManager.load(dudvMapTextureString, Texture.MinificationFilter.Trilinear,
                TextureStoreFormat.GuessNoCompressedFormat, true);
        matrix = new Matrix4();
        matrix.setValue(0, 0, 0.8);
        matrix.setValue(1, 1, 0.8);
        dudvTexture.setTextureMatrix(matrix);
        textureState.setTexture(dudvTexture, 2);
        dudvTexture.setWrap(Texture.WrapMode.Repeat);

        if (useRefraction) {
            textureRefract = new Texture2D();
            textureRefract.setWrap(Texture.WrapMode.EdgeClamp);
            textureRefract.setMagnificationFilter(Texture.MagnificationFilter.Bilinear);
            tRenderer.setupTexture(textureRefract);

            textureDepth = new Texture2D();
            textureDepth.setWrap(Texture.WrapMode.EdgeClamp);
            textureDepth.setMagnificationFilter(Texture.MagnificationFilter.NearestNeighbor);
            textureDepth.setTextureStoreFormat(TextureStoreFormat.Depth24);
            tRenderer.setupTexture(textureDepth);

            textureState.setTexture(textureRefract, 3);
            textureState.setTexture(textureDepth, 4);
        }

        if (useProjectedShader) {
            foamTexture = TextureManager.load(foamMapTextureString, Texture.MinificationFilter.Trilinear,
                    TextureStoreFormat.GuessCompressedFormat, true);
            if (useRefraction) {
                textureState.setTexture(foamTexture, 5);
            } else {
                textureState.setTexture(foamTexture, 3);
            }
            foamTexture.setWrap(Texture.WrapMode.Repeat);
        }

        clipState.setEnabled( true );
        clipState.setEnableClipPlane( ClipState.CLIP_PLANE0, true );

        reloadShader();
    }

    private Matrix4 fallbackTextureStateMatrix;

    private void createFallbackData() {
        fallbackTextureState = new TextureState();
        fallbackTextureState.setEnabled(true);

        fallbackTexture = TextureManager.load(fallbackMapTextureString, Texture.MinificationFilter.Trilinear,
                TextureStoreFormat.GuessCompressedFormat, true);
        fallbackTextureState.setTexture(fallbackTexture, 0);
        fallbackTexture.setWrap(Texture.WrapMode.Repeat);

        fallbackTextureStateMatrix = new Matrix4();

        as1 = new BlendState();
        as1.setBlendEnabled(true);
        as1.setTestEnabled(true);
        as1.setSourceFunction(BlendState.SourceFunction.SourceAlpha);
        as1.setDestinationFunction(BlendState.DestinationFunction.OneMinusSourceAlpha);
        as1.setEnabled(true);
    }

    public void update(final double tpf) {
        this.tpf = tpf;
    }


    @Override
    public void doRender(final Renderer r) {
        initialize(r);

        updateTranslations();

        final double camWaterDist = waterPlane.pseudoDistance(cam.getLocation());
        aboveWater = true;// camWaterDist >= 0;

        if (isSupported()) {
            waterShader.setUniform("tangent", tangent);
            waterShader.setUniform("binormal", binormal);
            waterShader.setUniform("useFadeToFogColor", useFadeToFogColor);
            waterShader.setUniform("waterColor", waterColorStart);
            waterShader.setUniform("waterColorEnd", waterColorEnd);
            waterShader.setUniform("normalTranslation", (float) normalTranslation);
            waterShader.setUniform("refractionTranslation", (float) refractionTranslation);
            waterShader.setUniform("abovewater", aboveWater);
            if (useProjectedShader) {
                waterShader.setUniform("cameraPos", cam.getLocation());
                waterShader.setUniform("waterHeight", (float) waterPlane.getConstant());
                waterShader.setUniform("amplitude", (float) waterMaxAmplitude);
                waterShader.setUniform("heightFalloffStart", (float) heightFalloffStart);
                waterShader.setUniform("heightFalloffSpeed", (float) heightFalloffSpeed);
            }

            final double heightTotal = clipBias + waterMaxAmplitude - waterPlane.getConstant();
            final Vector4 clipPlane = Vector4.fetchTempInstance();

            if (useReflection) {
                clipPlane.set(waterPlane.getNormal().getX(), waterPlane.getNormal().getY(), waterPlane.getNormal()
                        .getZ(), heightTotal);
                renderReflection();//clipPlane);
            }

            if (useRefraction && aboveWater) {
                clipPlane.set(-waterPlane.getNormal().getX(), -waterPlane.getNormal().getY(), -waterPlane.getNormal()
                        .getZ(), -waterPlane.getConstant());
                renderRefraction();//clipPlane);
            }
        }

        if (fallbackTextureState != null) {
            fallbackTextureStateMatrix.setValue(3, 1, normalTranslation);
            fallbackTexture.setTextureMatrix(fallbackTextureStateMatrix);
        }

        //super.draw(r);
    }

    protected void updateTranslations() {
        normalTranslation += speedReflection * tpf;
		refractionTranslation += speedRefraction * tpf;
    }

	public void reloadShader() {
        if (useProjectedShader) {
            if (useRefraction) {
                currentShaderStr = projectedShaderRefractionStr;
            } else {
                currentShaderStr = projectedShaderStr;
            }
        } else {
            if (useRefraction) {
                currentShaderStr = simpleShaderRefractionStr;
            } else {
                currentShaderStr = simpleShaderStr;
            }
        }

        try {
            logger.info("loading " + currentShaderStr);
            waterShader.setVertexShader(WaterNode.class.getClassLoader()
                    .getResourceAsStream(currentShaderStr + ".vert"));
            waterShader.setFragmentShader(WaterNode.class.getClassLoader().getResourceAsStream(
                    currentShaderStr + ".frag"));
        } catch (final IOException e) {
            logger.log(Level.WARNING, "Error loading shader", e);
            return;
        }

        waterShader.setUniform("normalMap", 0);
        waterShader.setUniform("reflection", 1);
        waterShader.setUniform("dudvMap", 2);
        if (useRefraction) {
            waterShader.setUniform("refraction", 3);
            waterShader.setUniform("depthMap", 4);
        }
        if (useProjectedShader) {
            if (useRefraction) {
                waterShader.setUniform("foamMap", 5);
            } else {
                waterShader.setUniform("foamMap", 3);
            }
        }

        waterShader._needSendShader = true;

        try {
            blurShaderVertical.setVertexShader(BloomRenderPass.class.getClassLoader().getResourceAsStream(
                    "com/ardor3d/extension/effect/bloom/bloom_blur.vert"));
            blurShaderVertical.setFragmentShader(BloomRenderPass.class.getClassLoader().getResourceAsStream(
                    "com/ardor3d/extension/effect/bloom/bloom_blur_vertical5_down.frag"));
        } catch (final IOException ex) {
            logger.logp(Level.SEVERE, getClass().getName(), "init(Renderer)", "Could not load shaders.", ex);
        }
        blurShaderVertical.setUniform("RT", 0);
        blurShaderVertical.setUniform("sampleDist", blurSampleDistance);
        blurShaderVertical._needSendShader = true;

        logger.info("Shader reloaded...");
	}

	public void setWaterEffectOnSpatial( Spatial spatial, boolean useTransparency) {
	    setWaterEffectOnSpatial( spatial );

	    if (useTransparency) {
	        if (fallbackTextureState == null) {
	            createFallbackData();
	        }
	        spatial.setRenderState( as1 );
	    }
	}
	
    /**
     * Sets a spatial up for being rendered with the watereffect
     * @param spatial Spatial to use as base for the watereffect
     */
	public void setWaterEffectOnSpatial( Spatial spatial ) {
        spatial.setRenderState(cullBackFace);
        if (isSupported()) {
            // spatial.setRenderBucketType(RenderBucketType.Skip);
            spatial.setRenderState(waterShader);
            spatial.setRenderState(textureState);
        } else {
            spatial.getSceneHints().setRenderBucketType(RenderBucketType.Transparent);
            spatial.getSceneHints().setLightCombineMode(LightCombineMode.Off);
            spatial.setRenderState(fallbackTextureState);
            spatial.setRenderState(as1);
        }
	}
	

	//temporary vectors for mem opt.
	private Vector3 tmpLocation = new Vector3();
	private Vector3 camReflectPos = new Vector3();
	private Vector3 camReflectDir = new Vector3();
	private Vector3 camReflectUp = new Vector3();
	private Vector3 camReflectLeft = new Vector3();
	private Vector3 camLocation = new Vector3();

	private void renderReflection() {
		System.out.println("renderReflection");
	    if (renderList == null || renderList.isEmpty()) {
	        return;
	    }
	    
	    reflectionTime += tpf;
        if (reflectionTime < reflectionThrottle) return;
        reflectionTime = 0;

		if( aboveWater ) {
			System.out.println("CAMERA "+cam.getLocation());
			
			camLocation.set( cam.getLocation() );

			double planeDistance = waterPlane.pseudoDistance( camLocation );
            calcVect.set(waterPlane.getNormal()).multiplyLocal( planeDistance * 2.0f );
			camReflectPos.set( camLocation.subtractLocal( calcVect ) );

			camLocation.set( cam.getLocation() ).addLocal( cam.getDirection() );
			planeDistance = waterPlane.pseudoDistance( camLocation );
            calcVect.set(waterPlane.getNormal()).multiplyLocal( planeDistance * 2.0f );
			camReflectDir.set( camLocation.subtractLocal( calcVect ) ).subtractLocal( camReflectPos ).normalizeLocal();

			camLocation.set( cam.getLocation() ).addLocal( cam.getUp() );
			planeDistance = waterPlane.pseudoDistance( camLocation );
            calcVect.set(waterPlane.getNormal()).multiplyLocal( planeDistance * 2.0f );
			camReflectUp.set( camLocation.subtractLocal( calcVect ) ).subtractLocal( camReflectPos ).normalizeLocal();

			camReflectLeft.set( camReflectUp ).crossLocal( camReflectDir ).normalizeLocal();

			tRenderer.getCamera().setLocation( camReflectPos );
			tRenderer.getCamera().setDirection( camReflectDir );
			tRenderer.getCamera().setUp( camReflectUp );
			tRenderer.getCamera().setLeft( camReflectLeft );
		}
		else {
			tRenderer.getCamera().setLocation( cam.getLocation() );
			tRenderer.getCamera().setDirection( cam.getDirection() );
			tRenderer.getCamera().setUp( cam.getUp() );
			tRenderer.getCamera().setLeft( cam.getLeft() );
		}

		if ( skyBox != null ) {
			tmpLocation.set( skyBox.getTranslation() );
			skyBox.setTranslation( tRenderer.getCamera().getLocation() );
			skyBox.updateGeometricState( 0.0d );
		}

        texArray.clear();
        texArray.add(textureReflect);
        
        if (isUseFadeToFogColor()) {
            tRenderer.enforceState(noFog);
            tRenderer.render( renderList, texArray,Renderer.BUFFER_NONE );
            //context.clearEnforcedState(RenderState.StateType.Fog);
        } else {
            tRenderer.render( renderList, texArray,Renderer.BUFFER_NONE );
        }

		if ( skyBox != null ) {
			skyBox.setTranslation( tmpLocation );
			skyBox.updateGeometricState(0f);
		}
	}

	private void renderRefraction() {
        if (renderList.isEmpty()) {
            return;
        }
        
        refractionTime += tpf;
        if (refractionTime < refractionThrottle) return;
        refractionTime = 0;

        tRenderer.getCamera().setLocation( cam.getLocation() );
		tRenderer.getCamera().setDirection( cam.getDirection() );
		tRenderer.getCamera().setUp( cam.getUp() );
		tRenderer.getCamera().setLeft( cam.getLeft() );

        CullHint cullMode = CullHint.Dynamic;
		if ( skyBox != null ) {
			cullMode = skyBox.getSceneHints().getCullHint();
			skyBox.getSceneHints().setCullHint( CullHint.Always );
		}

        texArray.clear();
        texArray.add(textureRefract);
        texArray.add(textureDepth);
        
        if (isUseFadeToFogColor()) {
            tRenderer.enforceState(noFog);
            tRenderer.render( renderList, texArray,Renderer.BUFFER_NONE );
            //context.clearEnforcedState(RenderState.StateType.Fog);
        } else {
            tRenderer.render( renderList, texArray,Renderer.BUFFER_NONE );
        }

		if ( skyBox != null ) {
			skyBox.getSceneHints().setCullHint( cullMode );
		}
	}

	public void removeReflectedScene( Spatial renderNode ) {
		if(renderList != null) {
			logger.info("Removed reflected scene: " + renderList.remove(renderNode));
		}
	}
	
	public void clearReflectedScene() {
		if(renderList != null) {
			renderList.clear();
		}
	}
	
    /**
     * Sets spatial to be used as reflection in the water(clears previously set)
     * @param renderNode Spatial to use as reflection in the water
     */
	public void setReflectedScene( Spatial renderNode ) {
		if(renderList == null) {
			renderList = new ArrayList<Spatial>();
		}
		renderList.clear();
		renderList.add(renderNode);
		renderNode.setRenderState( clipState );
		//renderNode.updateRenderState();
	}
    
	/**
     * Adds a spatial to the list of spatials used as reflection in the water
     * @param renderNode Spatial to add to the list of objects used as reflection in the water
	 */
	public void addReflectedScene( Spatial renderNode ) {
        if (renderNode == null) return;
        
		if(renderList == null) {
			renderList = new ArrayList<Spatial>();
		}
		if(!renderList.contains(renderNode)) {
			renderList.add(renderNode);
			renderNode.setRenderState( clipState );
			//renderNode.updateRenderState();
		}
	}

    /**
     * Sets up a node to be transformed and clipped for skybox usage
     * @param skyBox Handle to a node to use as skybox
     */
	public void setSkybox( Node skyBox ) {
        if (skyBox != null) {
    		ClipState skyboxClipState = new ClipState();//.getDisplaySystem().getRenderer().createClipState();
    		skyboxClipState.setEnabled( false );
    		skyBox.setRenderState( skyboxClipState );
    		//skyBox.updateRenderState();
        }

		this.skyBox = skyBox;
	}

	public Camera getCam() {
		return cam;
	}

	public void setCam( Camera cam ) {
		this.cam = cam;
	}

	public ColorRGBA getWaterColorStart() {
		return waterColorStart;
	}

    /** 
     * Color to use when the incident angle to the surface is low 
     */ 
	public void setWaterColorStart( ColorRGBA waterColorStart ) {
		this.waterColorStart = waterColorStart;
	}

	public ColorRGBA getWaterColorEnd() {
		return waterColorEnd;
	}

    /**
     * Color to use when the incident angle to the surface is high
     */
	public void setWaterColorEnd( ColorRGBA waterColorEnd ) {
		this.waterColorEnd = waterColorEnd;
	}

	public float getHeightFalloffStart() {
		return heightFalloffStart;
	}

    /**
     * Set at what distance the waveheights should start to fade out(for projected water only)
     * @param heightFalloffStart
     */
	public void setHeightFalloffStart( float heightFalloffStart ) {
		this.heightFalloffStart = heightFalloffStart;
	}

	public float getHeightFalloffSpeed() {
		return heightFalloffSpeed;
	}

    /**
     * Set the fadeout length of the waveheights, when over falloff start(for projected water only)
     * @param heightFalloffStart
     */
	public void setHeightFalloffSpeed( float heightFalloffSpeed ) {
		this.heightFalloffSpeed = heightFalloffSpeed;
	}

	public double getWaterHeight() {
		return waterPlane.getConstant();
	}

    /**
     * Set base height of the waterplane(Used for reflecting the camera for rendering reflection)
     * @param waterHeight Waterplane height
     */
	public void setWaterHeight( float waterHeight ) {
		this.waterPlane.setConstant( waterHeight );
	}

	public ReadOnlyVector3 getNormal() {
		return waterPlane.getNormal();
	}

    /**
     * Set the normal of the waterplane(Used for reflecting the camera for rendering reflection)
     * @param normal Waterplane normal
     */
	public void setNormal( Vector3 normal ) {
		waterPlane.setNormal( normal );
	}

	public float getSpeedReflection() {
		return speedReflection;
	}

    /**
     * Set the movement speed of the reflectiontexture
     * @param speedReflection Speed of reflectiontexture
     */
	public void setSpeedReflection( float speedReflection ) {
		this.speedReflection = speedReflection;
	}

	public float getSpeedRefraction() {
		return speedRefraction;
	}

    /**
     * Set the movement speed of the refractiontexture
     * @param speedRefraction Speed of refractiontexture
     */
	public void setSpeedRefraction( float speedRefraction ) {
		this.speedRefraction = speedRefraction;
	}

	public float getWaterMaxAmplitude() {
		return waterMaxAmplitude;
	}

    /**
     * Maximum amplitude of the water, used for clipping correctly(projected water only)
     * @param waterMaxAmplitude Maximum amplitude
     */
	public void setWaterMaxAmplitude( float waterMaxAmplitude ) {
		this.waterMaxAmplitude = waterMaxAmplitude;
	}

	public float getClipBias() {
		return clipBias;
	}

	public void setClipBias( float clipBias ) {
		this.clipBias = clipBias;
	}

	public Plane getWaterPlane() {
		return waterPlane;
	}

	public void setWaterPlane( Plane waterPlane ) {
		this.waterPlane = waterPlane;
	}

	public Vector3 getTangent() {
		return tangent;
	}

	public void setTangent( Vector3 tangent ) {
		this.tangent = tangent;
	}

	public Vector3 getBinormal() {
		return binormal;
	}

	public void setBinormal( Vector3 binormal ) {
		this.binormal = binormal;
	}

	public Texture getTextureReflect() {
		return textureReflect;
	}

	public Texture getTextureRefract() {
		return textureRefract;
	}

	public Texture getTextureDepth() {
		return textureDepth;
	}

    /**
     * If true, fade to fogcolor. If false, fade to 100% reflective surface
     * @param value
     */
    public void useFadeToFogColor(boolean value) {
        useFadeToFogColor = value;
    }

    public boolean isUseFadeToFogColor() {
        return useFadeToFogColor;
    }

	public boolean isUseReflection() {
		return useReflection;
	}

    /**
     * Turn reflection on and off
     * @param useReflection
     */
	public void setUseReflection(boolean useReflection) {
        if (useReflection == this.useReflection) return;
		this.useReflection = useReflection;
		reloadShader();
	}

	public boolean isUseRefraction() {
		return useRefraction;
	}

    /**
     * Turn refraction on and off
     * @param useRefraction
     */
	public void setUseRefraction(boolean useRefraction) {
        if (useRefraction == this.useRefraction) return;
		this.useRefraction = useRefraction;
		reloadShader();
	}

	public int getRenderScale() {
		return renderScale;
	}

	public void setRenderScale(int renderScale) {
		this.renderScale = renderScale;
	}

    public boolean isUseProjectedShader() {
        return useProjectedShader;
    }

    public void setUseProjectedShader(boolean useProjectedShader) {
        if (useProjectedShader == this.useProjectedShader) return;
        this.useProjectedShader = useProjectedShader;
        reloadShader();
    }

    public float getReflectionThrottle() {
        return reflectionThrottle;
    }

    public void setReflectionThrottle(float reflectionThrottle) {
        this.reflectionThrottle = reflectionThrottle;
    }

    public float getRefractionThrottle() {
        return refractionThrottle;
    }

    public void setRefractionThrottle(float refractionThrottle) {
        this.refractionThrottle = refractionThrottle;
    }

    public TextureState getTextureState() {
        return textureState;
    }

    public void setTextureState(TextureState textureState) {
        this.textureState = textureState;
    }

    public void updateCamera() {
        if (isSupported()) {
            tRenderer.getCamera().setFrustum( cam.getFrustumNear(), cam.getFrustumFar(), cam.getFrustumLeft(), cam.getFrustumRight(), cam.getFrustumTop(), cam.getFrustumBottom() );            
        }
    }

    public void setFallbackTexture(Texture fallbackTexture) {
        this.fallbackTexture = fallbackTexture;
    }

    public Texture getFallbackTexture() {
        return fallbackTexture;
    }

    public void setNormalmapTexture(Texture normalmapTexture) {
        this.normalmapTexture = normalmapTexture;
    }

    public Texture getNormalmapTexture() {
        return normalmapTexture;
    }

    public void setDudvTexture(Texture dudvTexture) {
        this.dudvTexture = dudvTexture;
    }

    public Texture getDudvTexture() {
        return dudvTexture;
    }

    public void setFoamTexture(Texture foamTexture) {
        this.foamTexture = foamTexture;
    }

    public Texture getFoamTexture() {
        return foamTexture;
    }
}
