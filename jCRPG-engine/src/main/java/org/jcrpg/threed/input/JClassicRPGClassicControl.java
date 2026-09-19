/**
 * Copyright (c) 2008-2010 Ardor Labs, Inc.
 *
 * This file is part of Ardor3D.
 *
 * Ardor3D is free software: you can redistribute it and/or modify it 
 * under the terms of its license which may be found in the accompanying
 * LICENSE file or at <http://www.ardor3d.com/LICENSE>.
 */

package org.jcrpg.threed.input;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import org.jcrpg.threed.J3DCore;
import org.jcrpg.ui.Window;
import org.jcrpg.ui.mouse.UiMouseAction;
import org.jcrpg.ui.mouse.UiMouseHandler;
import org.jcrpg.world.ai.EntityMemberInstance;

import com.ardor3d.framework.Canvas;
import com.ardor3d.input.GrabbedState;
import com.ardor3d.input.Key;
import com.ardor3d.input.KeyboardState;
import com.ardor3d.input.MouseButton;
import com.ardor3d.input.MouseState;
import com.ardor3d.input.logical.AnyKeyCondition;
import com.ardor3d.input.logical.InputTrigger;
import com.ardor3d.input.logical.LogicalLayer;
import com.ardor3d.input.logical.MouseButtonClickedCondition;
import com.ardor3d.input.logical.TriggerAction;
import com.ardor3d.input.logical.TriggerConditions;
import com.ardor3d.input.logical.TwoInputStates;
import com.ardor3d.math.FastMath;
import com.ardor3d.math.Matrix3;
import com.ardor3d.math.Vector3;
import com.ardor3d.math.type.ReadOnlyVector3;
import com.ardor3d.renderer.Camera;
import com.ardor3d.scenegraph.Node;
import com.ardor3d.scenegraph.controller.ComplexSpatialController.RepeatType;
import com.ardor3d.scenegraph.controller.interpolation.LinearVector3InterpolationController;
import com.google.common.base.Predicate;
import com.google.common.base.Predicates;

public class JClassicRPGClassicControl {

    public static final double MOVE_SPEED = 5d;

    private final Vector3 _upAxis = new Vector3();
    private double _mouseRotateSpeed = .005;
    private double _moveSpeed = 50;
    private double _keyRotateSpeed = 2.25;
    private final Matrix3 _workerMatrix = new Matrix3();
    private final Vector3 _workerStoreA = new Vector3();
    private InputTrigger _mouseTrigger;
    private InputTrigger _mouseClickTrigger;
    private InputTrigger _keyTrigger;

    private J3DCore _core;
    
    private Node interpolatedNode = new Node();
    
    public J3DCore getCore() {
		return _core;
	}

	public void setCore(J3DCore core) {
		interpolatedNode.removeFromParent();
		_core = core;
		_core.getRootNode1().attachChild(interpolatedNode);
	}

	public JClassicRPGClassicControl(final ReadOnlyVector3 upAxis) {
        _upAxis.set(upAxis);
    }

    public ReadOnlyVector3 getUpAxis() {
        return _upAxis;
    }

    public void setUpAxis(final ReadOnlyVector3 upAxis) {
        _upAxis.set(upAxis);
    }

    public double getMouseRotateSpeed() {
        return _mouseRotateSpeed;
    }

    public void setMouseRotateSpeed(final double speed) {
        _mouseRotateSpeed = speed;
    }

    public double getMoveSpeed() {
        return _moveSpeed;
    }

    public void setMoveSpeed(final double speed) {
        _moveSpeed = speed;
    }

    public double getKeyRotateSpeed() {
        return _keyRotateSpeed;
    }

    public void setKeyRotateSpeed(final double speed) {
        _keyRotateSpeed = speed;
    }
    
    
    
    
	protected void movePosition(float steps, Vector3 from, Vector3 toReach)
	{
		movePosition(steps, from, toReach,false);
	}
	protected void movePosition(float steps, Vector3 from, Vector3 toReach,boolean sinusoid)
	{
		
		long fromTime;
		double x, y, z;
		double currentPercent = 0;
		while (true)
		{
			
//			if (getToUpdateLocationToCamera()==null) 
			{
			
			//System.out.println("MOVING..");
			fromTime = System.currentTimeMillis();
    		x = (1/steps)* currentPercent * toReach.getX();
    		y = (1/steps)* currentPercent * toReach.getY();
    		z = (1/steps)* currentPercent * toReach.getZ();
    		
    		x += (1/steps) * (steps-currentPercent) * from.getX();
    		y += (1/steps) * (steps-currentPercent) * from.getY();
    		z += (1/steps) * (steps-currentPercent) * from.getZ();
    		
    		y+=FastMath.sin((Math.PI/steps)*currentPercent)/10;
    		
    		// setting new position...
    		//camera.setLocation(new Vector3(x,y,z));
    		// reading the might-have-been-changed direction of the real camera. (changed by mouse)
    		//ReadOnlyVector3 coreCamDir = _core.getCamera().getDirection();
    		
    		//setCameraDirection(camera, coreCamDir.getX(),coreCamDir.getY(),coreCamDir.getZ());
    		//camera.setDirection(_core.getCamera().getDirection().normalize(null));
    		
    		if (J3DCore.SETTINGS.WATER_SHADER)
    		{
    			//J3DCore.waterEffectRenderPass.setWaterHeight((float)y);//camera.getLocation().getYf());
    		}

    		setToUpdateLocationToCamera(new Vector3(x,y,z));


            long timePast = System.currentTimeMillis()-fromTime;
            currentPercent += timePast/20f;
            
    		if (steps<=currentPercent) break;
			} /*else
			{
				try{
				Thread.sleep(20);
				} catch (Exception ex) {}
			}*/
		}
		
	}
	
	
    /**
	 * Sets a camera's direction to a new x,y,z dir, setting its Up and Left too
	 * with rotation matrix.
	 * 
	 * @param camera
	 * @param x
	 * @param y
	 * @param z
	 */
    public static void setCameraDirection(Camera camera,  double x,double y,double z)
    {
    	setCameraDirection(camera, null,x, y, z);
    }
    
    /**
     * Sets a camera's direction to a new x,y,z dir, setting its Up and Left too with rotation matrix with an internal direction setting,
     * good for look up/down (needs a two step rotation).
     * @param camera
     * @param internalDirection
     * @param x
     * @param y
     * @param z
     */
    private static void setCameraDirection(Camera camera, Vector3 internalDirection,
			double x, double y, double z) {
		Matrix3 rotMat = new Matrix3();
		Vector3 dirOrigo = new Vector3(0f, 0f, -1);
		Vector3 left = new Vector3(-1, 0, 0);
		Vector3 up = new Vector3(0, 1, 0);

		if (internalDirection != null) {
			Vector3 dirNew = internalDirection;
			dirNew = dirNew.normalize(null);
			rotMat.fromStartEndLocal(dirOrigo, dirNew);
			rotMat.applyPost(left, left);
			rotMat.applyPost(up, up);

			up.normalize(null);
			left.normalize(null);
			dirOrigo = dirNew;
		}

		Vector3 dirNew = new Vector3(x, y, z);
		dirNew.normalizeLocal();
		rotMat.fromStartEndLocal(dirOrigo, dirNew);

		rotMat.applyPost(left, left);
		rotMat.applyPost(up, up);

		// this code is needed for Y axis bottom-down problem...
		if (internalDirection != null && internalDirection.getX() == 0
				&& internalDirection.getY() == 0 && internalDirection.getZ() == 1) {
			left.multiplyLocal(-1);
			up.multiplyLocal(-1);

		} else if (dirNew.getX() == 0 && dirNew.getY() == 0 && dirNew.getZ() == 1) {
			left.multiplyLocal(-1);
			up.multiplyLocal(-1);
		}

		/*
		Quaternion q = new Quaternion();
		q.fromAxes(left,up,dirNew);
		q.normalizeLocal();
		double [] f = q.toEulerAngles(null);
		if (f[0]<-3.09f || f[1]<-3.09f || f[0]>3.10f && f[1]>3.10f)
		{
	        Vector3 axis = new Vector3();
	        double angle = q.toAngleAxis(axis);
	        q.fromAngleNormalAxis(Math.PI + angle, axis);
			q.toAxes(new Vector3[]{dirNew,up,left});
		} else
		if ( f[0]==0 && f[1]==0 && f[2]>3.14d)
		{
			q.fromEulerAngles(0, f[1]+Math.PI, -f[2]);
			q.toAxes(new Vector3[]{dirNew,up,left});
		}*/

		
		up.normalize(null);
		left.normalize(null);

		
		
		camera.setDirection(dirNew);
		camera.setUp(up);
		camera.setLeft(left);
		camera.normalize();

	}

	
	
    protected void turnDirectionAndMove(Camera camera, float steps, Vector3 from, Vector3 toReach, Vector3 fromPos, Vector3 toPos, boolean almost) {
		long fromTime;
		double x1, y1, z1;
		double x, y, z;
		double currentPercent = 0;
		while (true)
		{
			fromTime = System.currentTimeMillis();
    		x1 = (1/steps)* currentPercent * toPos.getX();
    		y1 = (1/steps)* currentPercent * toPos.getY();
    		z1 = (1/steps)* currentPercent * toPos.getZ();
    		
    		x1 += (1/steps) * (steps-currentPercent) * fromPos.getX();
    		y1 += (1/steps) * (steps-currentPercent) * fromPos.getY();
    		z1 += (1/steps) * (steps-currentPercent) * fromPos.getZ();
    		
    		y1+=FastMath.sin((Math.PI/steps)*currentPercent)/10;
    		camera.setLocation(new Vector3(x1,y1,z1));
    		if (J3DCore.SETTINGS.WATER_SHADER)
    		{
    			//J3DCore.waterEffectRenderPass.setWaterHeight(camera.getLocation().getYf());
    		}
    		
			x = (1 / steps) * currentPercent * toReach.getX();
			y = (1 / steps) * currentPercent * toReach.getY();
			z = (1 / steps) * currentPercent * toReach.getZ();

			x += (1 / steps) * (steps - currentPercent) * from.getX();
			y += (1 / steps) * (steps - currentPercent) * from.getY();
			z += (1 / steps) * (steps - currentPercent) * from.getZ();

			setCameraDirection(camera, x, y, z);
			camera.update();
			camera.normalize();
		
			setToUpdateToCamera(camera);

            long timePast = System.currentTimeMillis()-fromTime;
            currentPercent += timePast/20f;
            if (steps<=currentPercent) break;
		}

	}
 

    /**
	 * Turns between to direction to a certain percent (good for look up/down).
	 * 
	 * @param from
	 * @param toReach
	 * @param percent
	 */
    protected void turnDirection(Camera camera, Vector3 from, Vector3 toReach, int percent)
	{
		double x, y, z;
		x = (1 / 100f) * percent * toReach.getX();
		y = (1 / 100f) * percent * toReach.getY();
		z = (1 / 100f) * percent * toReach.getZ();

		x += (1 / 100f) * (100 - percent) * from.getX();
		y += (1 / 100f) * (100 - percent) * from.getY();
		z += (1 / 100f) * (100 - percent) * from.getZ();


		setCameraDirection(camera, from, x,y,z);

        camera.normalize();
        camera.update();
        setToUpdateToCamera(camera);		
	}
 

    /**
     * Sets Upward or Downward look based on the precentage stored in handler.
     */
    protected void setLookVertical(Camera camera)
    
    {
        Vector3 toReach = null;
        
        Vector3 from = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
        if (lookUpDownPercent<0)
        	toReach = J3DCore.turningDirectionsUnit[J3DCore.BOTTOM];//[handler.core.gameState.viewDirection];
        else
        	toReach = J3DCore.turningDirectionsUnit[J3DCore.TOP];//J3DCore.topRotationDirections[handler.core.gameState.viewDirection];
        
        turnDirection(camera, from, toReach, Math.abs(lookUpDownPercent));

    }
    /**
     * Sets Left or Right look based on the precentage stored in handler.
     */
    protected void setLookHorizontal(Camera camera)
    
    {
        Vector3 toReach = null;
        
        Vector3 from = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
        if (lookLeftRightPercent<0) {
        	int vdN = _core.gameState.getCurrentRenderPositions().viewDirection-1;
        	if (vdN<0) vdN = 3;
        	toReach = J3DCore.turningDirectionsUnit[vdN];
        }
        else {
        	int vdN = _core.gameState.getCurrentRenderPositions().viewDirection+1;
        	if (vdN>3) vdN = 0;
        	toReach = J3DCore.turningDirectionsUnit[vdN];
        }
        
        turnDirection(camera, from, toReach, Math.abs(lookLeftRightPercent));

    }
    protected void setLookVerHor(Camera camera)
    {
        Vector3 toReach = null;
        
        Vector3 from = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
        if (lookUpDownPercent<0)
        	toReach = J3DCore.turningDirectionsUnit[J3DCore.BOTTOM];//[handler.core.gameState.viewDirection];
        else
        	toReach = J3DCore.turningDirectionsUnit[J3DCore.TOP];//J3DCore.topRotationDirections[handler.core.gameState.viewDirection];
        
        Vector3 toReachHor = null;
        
        if (lookLeftRightPercent<0) {
        	int vdN = _core.gameState.getCurrentRenderPositions().viewDirection-1;
        	if (vdN<0) vdN = 3;
        	toReachHor = J3DCore.turningDirectionsUnit[vdN];
        }
        else {
        	int vdN = _core.gameState.getCurrentRenderPositions().viewDirection+1;
        	if (vdN>3) vdN = 0;
        	toReachHor = J3DCore.turningDirectionsUnit[vdN];
        }

		double x1, y1, z1;
		x1 = (1 / 100f) * Math.abs(lookUpDownPercent) * toReach.getX();
		y1 = (1 / 100f) * Math.abs(lookUpDownPercent) * toReach.getY();
		z1 = (1 / 100f) * Math.abs(lookUpDownPercent) * toReach.getZ();

		x1 += (1 / 100f) * (100 - Math.abs(lookUpDownPercent)) * from.getX();
		y1 += (1 / 100f) * (100 - Math.abs(lookUpDownPercent)) * from.getY();
		z1 += (1 / 100f) * (100 - Math.abs(lookUpDownPercent)) * from.getZ();
		toReach = new Vector3(x1, y1, z1);
		
		double x2, y2, z2;
		x2 = (1 / 100f) * Math.abs(lookLeftRightPercent) * toReachHor.getX();
		y2 = (1 / 100f) * Math.abs(lookLeftRightPercent) * toReachHor.getY();
		z2 = (1 / 100f) * Math.abs(lookLeftRightPercent) * toReachHor.getZ();

		x2 += (1 / 100f) * (100 - Math.abs(lookLeftRightPercent)) * from.getX();
		y2 += (1 / 100f) * (100 - Math.abs(lookLeftRightPercent)) * from.getY();
		z2 += (1 / 100f) * (100 - Math.abs(lookLeftRightPercent)) * from.getZ();
		toReachHor = new Vector3(x2, y2, z2);
		
		toReachHor = toReach.normalize(null).add(toReachHor.normalize(null),null).normalize(null);


		setCameraDirection(camera, from, toReachHor.getX(),toReachHor.getY(),toReachHor.getZ());

        camera.normalize();
        camera.update();
        setToUpdateToCamera(camera);    	
    }

    
    
    

    
    public Object mutex = new Object();
	public boolean locked = false;
	
	public synchronized boolean lockHandling()
	{
		synchronized(mutex)
		{
			if (locked) return false;
			locked = true;
			return true;
		}
	}
	public synchronized void unlockHandling()
	{
		synchronized(mutex)
		{
			locked = false;
		}
	}

	
 
	public Vector3 getToUpdateLocationToCamera()
	{
		return toUpdateLocationToCamera;
	}
	
	public static Camera toUpdateToCamera = null;
	public void setToUpdateToCamera(Camera cam)
	{
		toUpdateToCamera = cam;
	}
	public static Vector3 toUpdateLocationToCamera = null;
	public void setToUpdateLocationToCamera(Vector3 cam)
	{
		toUpdateLocationToCamera = cam;
	}

	public int lookUpDownPercent = 0;
    public int lookLeftRightPercent = 0;

    public enum ControllerState {
        IDLE,

         MOVEMENT,

        UI;
    }
  
    
    
    private ControllerState state = ControllerState.IDLE;
    
    boolean movementFinished = false;
    boolean turningFinished = false;

    public void setMovementFinished()
	{
		movementFinished = true;
	}
	public void setTurningFinished()
	{
		turningFinished = true;
	}


    public void update(double tpf)
    {
    	if (state == ControllerState.MOVEMENT)
    	{
    		if (movementStarted)
    		{
	    		if (interpolatedNode.getControllerCount()>0 && ((LinearVector3InterpolationController)interpolatedNode.getController(0)).getControls().get(2).distance(_core.getCamera().getLocation())>0.0d)
		    	{
		    		
		    		//System.out.println("--- TRANSLATING FROM: "+_core.getCamera().getLocation());
		    		//System.out.println("+++ TRANSLATING TO: "+interpolatedNode.getTranslation());
		        	_core.getCamera().setLocation(interpolatedNode.getTranslation());
		        	_core.updateTimeRelated();
		    	} else
		    	{
		    		System.out.println(System.currentTimeMillis()%1000000+ " ########### MOVEMENT FINISHED ################");
			        long time = System.currentTimeMillis();
		    		_core.setCalculatedCameraLocation();
	//		        _core.sEngine.renderToViewPort();
					System.out.println("time = "+(System.currentTimeMillis()-time));
					state = ControllerState.IDLE;
					movementStarted = false;
		    		unlockHandling();
		    	}
    		}
    	}
    	
    	if (state == ControllerState.UI)
    	{
    		_core.getMouseManager().setGrabbed(GrabbedState.NOT_GRABBED);
    	}
    	
    	
		if (toUpdateToCamera!=null)
		{
			_core.getCamera().set(toUpdateToCamera);
			toUpdateToCamera = null;
			// TODO camera is shivering // _core.updateTimeRelated();
		}
		if (toUpdateLocationToCamera!=null)
		{
			_core.getCamera().setLocation(toUpdateLocationToCamera.clone());
			toUpdateLocationToCamera = null;
			//_core.updateTimeRelated();
		}

		if (turningFinished || movementFinished)
		{
	        _core.setCalculatedCameraLocation();
	        _core.getCamera().update();
			if (movementFinished) {
				_core.sEngine.renderToViewPort();
				_core.getCamera().update();

			}
	        movementFinished = false;
	        turningFinished = false;
		}

    }

    public synchronized void turnRight() {
//    	if (!performActionCheck(evt)){
  //      	if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("locked...");
    //		return;
    	//}
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
    	Runnable r = new Runnable() {
			public void run() {
				
		        if (lookLeftRightPercent>0) {
		        	// if looked away to right, bigger view needed
		        	if (_core.sEngine.optimizeAngle) _core.sEngine.renderToViewPort(J3DCore.ROTATE_VIEW_ANGLE+0.6f);
		        } else
		        {
		        	if (_core.sEngine.optimizeAngle) _core.sEngine.renderToViewPort(J3DCore.ROTATE_VIEW_ANGLE);
		        }
		    	Vector3 from = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
		    	Vector3 fromPos = J3DCore.getInstance().getCurrentLocation();
		        _core.turnRight();
		    	Vector3 toReach = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
		    	Vector3 toPos = J3DCore.getInstance().getCurrentLocation();
		        float steps = J3DCore.MOVE_STEPS;
		        turnDirectionAndMove(_core.getSafeCameraCopy(), steps,from,toReach,fromPos,toPos,false);
		        lookUpDownPercent = 0;
		        lookLeftRightPercent = 0;
		        setLookVertical(_core.getSafeCameraCopy()); // this should be always called to override bad camera view caused by performance related rotation skips

		        setTurningFinished();
		    	state = ControllerState.IDLE;
		        unlockHandling();
			}
		};
		new Thread(r).start();
   }

    public synchronized void turnLeft() {
//    	if (!performActionCheck(evt)){
  //      	if (J3DCore.LOGGING()) Jcrpg.LOGGER.finest("locked...");
    //		return;
    	//}
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
    	Runnable r = new Runnable() {
			public void run() {
				
		        if (lookLeftRightPercent>0) {
		        	// if looked away to right, bigger view needed
		        	if (_core.sEngine.optimizeAngle) _core.sEngine.renderToViewPort(J3DCore.ROTATE_VIEW_ANGLE+0.6f);
		        } else
		        {
		        	if (_core.sEngine.optimizeAngle) _core.sEngine.renderToViewPort(J3DCore.ROTATE_VIEW_ANGLE);
		        }
		    	Vector3 from = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
		    	Vector3 fromPos = J3DCore.getInstance().getCurrentLocation();
		        _core.turnLeft();
		    	Vector3 toReach = J3DCore.turningDirectionsUnit[_core.gameState.getCurrentRenderPositions().viewDirection];
		    	Vector3 toPos = J3DCore.getInstance().getCurrentLocation();
		        float steps = J3DCore.MOVE_STEPS;
		        turnDirectionAndMove(_core.getSafeCameraCopy(), steps,from,toReach,fromPos,toPos,false);
		        lookUpDownPercent = 0;
		        lookLeftRightPercent = 0;
		        setLookVertical(_core.getSafeCameraCopy()); // this should be always called to override bad camera view caused by performance related rotation skips

		        setTurningFinished();
		    	state = ControllerState.IDLE;
		        unlockHandling();
			}
		};
		new Thread(r).start();
   }
    
   private boolean movementStarted = false;
    
    public void doMove(Vector3 from)
    {
    	movementStarted = true;
		_core.sEngine.renderToViewPort();

    	interpolatedNode.clearControllers();
    	Vector3 toReach = _core.getCurrentLocation();
    	interpolatedNode.setTranslation(from);
    	LinearVector3InterpolationController control = new LinearVector3InterpolationController();
    	Vector3 v = new Vector3((from.getX()+toReach.getX())/2d,(from.getY()+toReach.getY())/2d+0.2f,(from.getZ()+toReach.getZ())/2d);
    	
    	control.setControls(new Vector3[]{from,v,toReach});
    	control.setSpeed(MOVE_SPEED);
    	control.setRepeatType(RepeatType.CLAMP);
    	interpolatedNode.addController(control);
    	
    }

    public void forward() {
    	if (!lockHandling()) return;
		System.out.println(System.currentTimeMillis()%1000000+" - @@@@@@@@@@@@ MOVEMENT STARTED @@@@@@@@@@");

    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveForward(_core.gameState.getCurrentRenderPositions().viewDirection)) 
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }
    }
    public void up() {
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveUp())
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }
    }
    public void down() {
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveDown()) 
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }
    }

    
    
    public void backward() {
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveBackward(_core.gameState.getCurrentRenderPositions().viewDirection)) 
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }

    }

    public void moveLeft() {
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveLeft(_core.gameState.getCurrentRenderPositions().viewDirection)) 
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }
    }
    public void moveRight() {
    	if (!lockHandling()) return;
    	state = ControllerState.MOVEMENT;
        Vector3 from = getCore().getCurrentLocation();
        if (_core.moveRight(_core.gameState.getCurrentRenderPositions().viewDirection)) 
        {
			doMove(from);
        } else
        {
        	state = ControllerState.IDLE;
        	unlockHandling();
        }
    }

    
    public void performAction(KeyboardState evt) {
		Key eventKey = evt.getKeysDown().iterator().next();
		String event = eventToKeyMapping.get(eventKey);
		System.out.println("PERFORMING FOR "+eventKey +" "+event);
		if (event!=null)
		{
			if (callHandling(event)) return;
		}
		Set<String> a = getAdditionalCommands(event);
		if (a!=null)
		{
			for (String s:a)
			{
				if (callHandling(s)) return;
			}
		}
	}

	boolean noToggleWindowByKey = false;
	
	public void setForbidWindowEventHandling(boolean b)
	{
		noToggleWindowByKey = b;
	}
	
	
	private boolean callHandling(String event)
	{
		if (noToggleWindowByKey || !_core.uiBase.handleWindowEvent(event))
		{
			return _core.uiBase.handleEvent(event);
			// handling additional commands for the event (because handler cannot bind one key to
			// several commands...)
		} 
		return false;
	}

    public HashMap<String, HashSet<String>> commandToCommandsMap = new HashMap<String, HashSet<String>>();
    
    public void addAdditionalCommands(String command, String[] additionalCommands)
    {
    	HashSet<String> set = commandToCommandsMap.get(command);
    	if (set==null) {
    		set = new HashSet<String>();
    		commandToCommandsMap.put(command, set);
    	}
    	for (String s:additionalCommands)
    	{
    		set.add(s);
    	}
    }
    
    /**
     * Return all commands that are triggered by same key as the given command which took the key
     * for handling upon setting the keyboard up.
     * @param command
     * @return The list of commands that should be handled after the 'command'.
     */
    public Set<String> getAdditionalCommands(String command)
    {
    	return commandToCommandsMap.get(command);
    }
 
	private HashMap<Key, String > eventToKeyMapping = new HashMap<Key, String>();
	
	private void putToMap(String s, Key k)
	{
		eventToKeyMapping.put(k, s);
	}
	
	protected void initMapping() {
		// TODO review this part. Camping is missing...
		
		putToMap("forward", Key.W);
		putToMap("backward", Key.S);
		putToMap("strafeLeft", Key.Q);
		putToMap("strafeRight", Key.E);
		putToMap("lookUp", Key.UP);
		putToMap("lookDown", Key.DOWN);
		putToMap("lookLeft", Key.LEFT);
		putToMap("lookRight", Key.RIGHT);
		putToMap("climbUp", Key.R);
		putToMap("climbDown", Key.F);
		putToMap("turnRight", Key.D);
		putToMap("turnLeft", Key.A);

		putToMap("camp", Key.C);
		putToMap("worldMap", Key.F1);
		putToMap("behaviorWindow", Key.F2);
		putToMap("charSheetWindow", Key.F3);
		putToMap("inventoryWindow", Key.F4);
		putToMap("partyOrderWindow", Key.F5);
		putToMap("normalActWindow", Key.F6);
		putToMap("mainMenu", Key.F10);
		putToMap("cacheStateInfo", Key.F11);
		putToMap("logUp", Key.PAGEUP_PRIOR);
		putToMap("logDown", Key.PAGEDOWN_NEXT);
		putToMap("enter", Key.RETURN);
		putToMap("back", Key.BACK);
		putToMap("A", Key.A);
		if (!J3DCore.FREE_MOVEMENT)
			putToMap("B", Key.B);
		putToMap("C", Key.C);
		addAdditionalCommands("C", new String[] { "camp" });
		putToMap("D", Key.D);
		putToMap("E", Key.E);
		putToMap("F", Key.F);
		putToMap("G", Key.G);
		putToMap("H", Key.H);
		putToMap("I", Key.I);
		putToMap("J", Key.J);
		putToMap("K", Key.K);
		if (!J3DCore.FREE_MOVEMENT) // if not debug set this
			putToMap("L", Key.L);
		addAdditionalCommands("L", new String[] { "torch" });
		putToMap("M", Key.M);
		putToMap("N", Key.N);
		putToMap("O", Key.O);
		addAdditionalCommands("O", new String[] { "storageWindow" });
		putToMap("P", Key.P);
		putToMap("Q", Key.Q);
		putToMap("R", Key.R);
		putToMap("S", Key.S);
		if (!J3DCore.FREE_MOVEMENT) // if not debug set this
			putToMap("T", Key.T);
		addAdditionalCommands("T", new String[] { "poolInfo" });
		putToMap("U", Key.U);
		putToMap("V", Key.V);
		putToMap("W", Key.W);
		putToMap("X", Key.X);
		putToMap("Y", Key.Y);
		putToMap("Z", Key.Z);
		putToMap("0", Key.ZERO);
		putToMap("1", Key.ONE);
		putToMap("2", Key.TWO);
		putToMap("3", Key.THREE);
		putToMap("4", Key.FOUR);
		putToMap("5", Key.FIVE);
		putToMap("6", Key.SIX);
		putToMap("7", Key.SEVEN);
		putToMap("8", Key.EIGHT);
		putToMap("9", Key.NINE);
		putToMap("space", Key.SPACE);
		putToMap("delete", Key.DELETE);
		putToMap("shift", Key.LSHIFT);
	}
	
    protected void handleKeyboardEvent(final Camera camera, final KeyboardState kb, final double tpf) {
    
    	if (state==ControllerState.UI || state==ControllerState.IDLE)
    	{
    		performAction(kb);
    	}
    }
    protected void move(final Camera camera, final KeyboardState kb, final double tpf) {
        
    	if (locked) return;
        
    	System.out.println("move STATE = "+state);
    	// MOVEMENT
        if (state==ControllerState.MOVEMENT) return;
    	
        if (state==ControllerState.IDLE)
        {
        
	    	if (kb.isDown(Key.W)) {
	        	forward();
	        }
	        if (kb.isDown(Key.S)) {
	        	backward();
	        }
	        if (kb.isDown(Key.A)) {
	        	turnLeft();
	        }
	        if (kb.isDown(Key.D)) {
	        	turnRight();
	        }
	        if (kb.isDown(Key.Q)) {
	        	moveLeft();
	        }
	        if (kb.isDown(Key.E)) {
	        	moveRight();
	        }
	    	if (kb.isDown(Key.R)) {
	        	up();
	        }
	    	if (kb.isDown(Key.F)) {
	        	down();
	        }
        }
    }

    public boolean isInMovement()
    {
    	return state == ControllerState.MOVEMENT;
    }

    public boolean isUIEnabled()
    {
    	return state == ControllerState.UI;
    }
    
    
    private boolean lastStateGrabbed = false;
    
    public boolean isMouseLookOn()
    {
    	return _core.getMouseManager().getGrabbed()==GrabbedState.GRABBED;
    }
    
    /**
     * Switches UI mode to state on/off
     * @param t
     */
    public void switchUIMode(boolean t)
    {
    	
    	if (!t && state!= ControllerState.UI) return;
    	if (t && state== ControllerState.UI) return;
    	
    	System.out.println("switchUIMode "+t);
    	
    	if (t)
    	{
    		if (!encounterMode){
    			// saving mouse grab state...
    			lastStateGrabbed = _core.getMouseManager().getGrabbed()==GrabbedState.GRABBED;
    		}
    		state = ControllerState.UI;
    	} else
    	{
    		if (!encounterMode)
    		{
	    		if (lastStateGrabbed)
	    		{
	    			// restoring last grabbed state
	           		_core.getMouseManager().setGrabbed(GrabbedState.GRABBED);
	    		}
    		}
    		state = ControllerState.IDLE;
    	}
    }
    boolean grabStateBeforeCombat = false;
    boolean encounterMode = false;
    public void switchToEncounterModeMouse(boolean on)
    {
    	encounterMode = on;
    	if (on)
    	{
	   		// saving mouse grab state...
	    	grabStateBeforeCombat = _core.getMouseManager().getGrabbed()==GrabbedState.GRABBED;
	   	
	    	_core.getMouseManager().setGrabbed(GrabbedState.NOT_GRABBED);
    	} else
    	{
    		if (grabStateBeforeCombat)
    		{
    			// restoring last grabbed state
           		_core.getMouseManager().setGrabbed(GrabbedState.GRABBED);
    		} else
    		{
    	    	_core.getMouseManager().setGrabbed(GrabbedState.NOT_GRABBED);
    		}
    	}
    }
    /**
     * Sets the UI's root node, which will be used for mouse picking. Set null if no UI is used.
     * @param node
     */
    public void setUIRootNode(Node node)
    {
    	jcrpgUiAction.setRootNode(node);
    }
    /**
     * Secondary UI root node, children are picked AFTER UI rootnode was picked and no element found.
     * @param node
     */
    public void setSecondaryUIFocusNode(Node node)
    {
    	jcrpgUiAction.setSecondaryFocusNode(node);
    }
    
	public static final int PRIMARY_INPUT_TYPE = 0, SECONDARY_INPUT_TYPE = 1;
	
	/**
	 * Call this back if portrait is 'used' (clicked etc.)
	 * @param count Number of member in party
	 * @param member Member object
	 * @param secondaryWay Was it a secondary input
	 */
	public void characterSelected(int count, EntityMemberInstance member, int inputType)
	{
		if (J3DCore.getInstance().gameState.player!=null)
		{
			if (J3DCore.getInstance().uiBase.activeWindows.size()==0)
			{
				if (inputType == PRIMARY_INPUT_TYPE)
				{
					
					J3DCore.getInstance().inventoryWindow.toggle();
					J3DCore.getInstance().inventoryWindow.directUpdateToMember(member);
					
				} else
				{
					J3DCore.getInstance().charSheetWindow.toggle();
					J3DCore.getInstance().charSheetWindow.directUpdateToMember(member);
				}
			} else
			{
				for (Window w:J3DCore.getInstance().uiBase.activeWindows)
				{
					w.characterSelected(count, member, inputType);
				}
			}
		}
	}

    
    protected void handleMouseAction(final Camera camera, TwoInputStates inputStates, final double dx, final double dy) {

    	if (_core.getMouseManager().getGrabbed()!=GrabbedState.GRABBED)
    	{
			if (jcrpgUiAction.performAction(inputStates)) return; // mouse picked ui
		}

    	// if not UI state, grab can be switched on/off
    	if (state != ControllerState.UI && inputStates.getCurrent().getMouseState().getButtonsClicked().contains(MouseButton.RIGHT))
   		{
       		_core.getMouseManager().setGrabbed(_core.getMouseManager().getGrabbed()==GrabbedState.GRABBED?GrabbedState.NOT_GRABBED:GrabbedState.GRABBED);
    		System.out.println("GRAB..."+_core.getMouseManager().getGrabbed());
   		}

    	
    	// if in UI or state is not grabbed, don't follow pointer movement.
    	if (state == ControllerState.UI || _core.getMouseManager().getGrabbed()!=GrabbedState.GRABBED  ) return;
    	
        if (dx != 0) {
            _workerMatrix.fromAngleNormalAxis(_mouseRotateSpeed * dx, _upAxis != null ? _upAxis : camera.getUp());
            _workerMatrix.applyPost(camera.getLeft(), _workerStoreA);
            camera.setLeft(_workerStoreA);
            _workerMatrix.applyPost(camera.getDirection(), _workerStoreA);
            camera.setDirection(_workerStoreA);
            _workerMatrix.applyPost(camera.getUp(), _workerStoreA);
            camera.setUp(_workerStoreA);
        }

        if (dy != 0) {
            _workerMatrix.fromAngleNormalAxis(_mouseRotateSpeed * dy, camera.getLeft());
            _workerMatrix.applyPost(camera.getLeft(), _workerStoreA);
            camera.setLeft(_workerStoreA);
            _workerMatrix.applyPost(camera.getDirection(), _workerStoreA);
            camera.setDirection(_workerStoreA);
            _workerMatrix.applyPost(camera.getUp(), _workerStoreA);
            camera.setUp(_workerStoreA);
        }

        camera.normalize();
        
        if (!locked || state==ControllerState.MOVEMENT)
        {
	        
            // check camera direction , to which direction the camera direction is closest to, and set that to current direction!
            // that way mouse look + movement are related, easier movement

        	int dirCount = 0;
	        ReadOnlyVector3 cDir = camera.getDirection();
	        int minDistDir = 0;
	        double minDist = Double.POSITIVE_INFINITY;
	        for (Vector3 d:J3DCore.directions)
	        {
	        	
	        	double dist = cDir.distance(d);
	        	if (dist<minDist)
	        	{
	        		minDist = dist;
	        		minDistDir = dirCount;
	        	}
	        	dirCount++;
	        }
	        _core.turnTo(minDistDir);   
	        // TODO call DirectOMeter/Map update, compass.
        }
        
    }
    
    
    protected void moveMouse(final Camera camera, final double dx, final double dy) {

    	if (state == ControllerState.UI) return;
    	
        if (dx != 0) {
            _workerMatrix.fromAngleNormalAxis(_mouseRotateSpeed * dx, _upAxis != null ? _upAxis : camera.getUp());
            _workerMatrix.applyPost(camera.getLeft(), _workerStoreA);
            camera.setLeft(_workerStoreA);
            _workerMatrix.applyPost(camera.getDirection(), _workerStoreA);
            camera.setDirection(_workerStoreA);
            _workerMatrix.applyPost(camera.getUp(), _workerStoreA);
            camera.setUp(_workerStoreA);
        }

        if (dy != 0) {
            _workerMatrix.fromAngleNormalAxis(_mouseRotateSpeed * dy, camera.getLeft());
            _workerMatrix.applyPost(camera.getLeft(), _workerStoreA);
            camera.setLeft(_workerStoreA);
            _workerMatrix.applyPost(camera.getDirection(), _workerStoreA);
            camera.setDirection(_workerStoreA);
            _workerMatrix.applyPost(camera.getUp(), _workerStoreA);
            camera.setUp(_workerStoreA);
        }

        camera.normalize();
        
        if (!locked || state==ControllerState.MOVEMENT)
        {
	        
            // check camera direction , to which direction the camera direction is closest to, and set that to current direction!
            // that way mouse look + movement are related, easier movement

        	int dirCount = 0;
	        ReadOnlyVector3 cDir = camera.getDirection();
	        int minDistDir = 0;
	        double minDist = Double.POSITIVE_INFINITY;
	        for (Vector3 d:J3DCore.directions)
	        {
	        	
	        	double dist = cDir.distance(d);
	        	if (dist<minDist)
	        	{
	        		minDist = dist;
	        		minDistDir = dirCount;
	        	}
	        	dirCount++;
	        }
	        _core.turnTo(minDistDir);   
	        // TODO call DirectOMeter/Map update, compass.
        }
        
    }

    /**
     * @param layer
     *            the logical layer to register with
     * @param upAxis
     *            the up axis of the camera
     * @param dragOnly
     *            if true, mouse input will only rotate the camera if one of the mouse buttons (left, center or right)
     *            is down.
     * @return a new FirstPersonControl object
     */
    public static JClassicRPGClassicControl setupTriggers(final LogicalLayer layer, final ReadOnlyVector3 upAxis,
            final boolean dragOnly) {

        final JClassicRPGClassicControl control = new JClassicRPGClassicControl(upAxis);
        control.setupKeyboardTriggers(layer);
        control.setupMouseTriggers(layer, dragOnly);
        return control;
    }

    /**
     * Deregister the triggers of the given FirstPersonControl from the given LogicalLayer.
     * 
     * @param layer
     * @param control
     */
    public static void removeTriggers(final LogicalLayer layer, final JClassicRPGClassicControl control) {
        if (control._mouseTrigger != null) {
            layer.deregisterTrigger(control._mouseTrigger);
        }
        if (control._mouseClickTrigger != null) {
                layer.deregisterTrigger(control._mouseClickTrigger);
        }
        if (control._keyTrigger != null) {
            layer.deregisterTrigger(control._keyTrigger);
        }
    }

    UiMouseAction jcrpgUiAction = null;
    
    public void setupMouseTriggers(final LogicalLayer layer, final boolean dragOnly) {
    	
    	jcrpgUiAction = new UiMouseAction();
    	
    	new UiMouseHandler();
    	
        final JClassicRPGClassicControl control = this;
        // Mouse look
        final Predicate<TwoInputStates> someMouseDown = Predicates.or(TriggerConditions.leftButtonDown(), Predicates
                .or(TriggerConditions.rightButtonDown(), TriggerConditions.middleButtonDown()));
        final Predicate<TwoInputStates> dragged = Predicates.and(TriggerConditions.mouseMoved(), someMouseDown);
        final TriggerAction dragAction = new TriggerAction() {

            // Test boolean to allow us to ignore first mouse event. First event can wildly vary based on platform.
            private boolean firstPing = true;

            public void perform(final Canvas source, final TwoInputStates inputStates, final double tpf) {
                final MouseState mouse = inputStates.getCurrent().getMouseState();
                if (mouse.getDx() != 0 || mouse.getDy() != 0) {
                    if (!firstPing) {
                        control.moveMouse(source.getCanvasRenderer().getCamera(), -mouse.getDx(), -mouse.getDy());
                    } else {
                        firstPing = false;
                    }
                }
            }
        };
        final Predicate<TwoInputStates> clickLeftOrRightOrMove = Predicates.or(new MouseButtonClickedCondition(
                MouseButton.LEFT), new MouseButtonClickedCondition(MouseButton.RIGHT), TriggerConditions.mouseMoved());
        /*final Predicate<TwoInputStates> clickLeftAndMove = Predicates.and(new MouseButtonClickedCondition(
                MouseButton.LEFT), TriggerConditions.mouseMoved());*/
        final TriggerAction clickAction = new TriggerAction() {

            // Test boolean to allow us to ignore first mouse event. First event can wildly vary based on platform.
            private boolean firstPing = true;

            public void perform(final Canvas source, final TwoInputStates inputStates, final double tpf) {
                final MouseState mouse = inputStates.getCurrent().getMouseState();
                //if (mouse.getDx() != 0 || mouse.getDy() != 0) 
                {
                    if (!firstPing) {
                        control.handleMouseAction(source.getCanvasRenderer().getCamera(), inputStates, -mouse.getDx(), -mouse.getDy());
                    } else {
                        firstPing = false;
                    }
                }
            }
        };

        //_mouseTrigger = new InputTrigger(TriggerConditions.mouseMoved(), dragAction);
        //layer.registerTrigger(_mouseTrigger);
        _mouseClickTrigger = new InputTrigger(clickLeftOrRightOrMove, clickAction);
        layer.registerTrigger(_mouseClickTrigger);
        //_mouseClickTrigger = new InputTrigger(clickLeftAndMove, clickAction);
        //layer.registerTrigger(_mouseClickTrigger);
    }

    public Predicate<TwoInputStates> setupKeyboardTriggers(final LogicalLayer layer) {

        final JClassicRPGClassicControl control = this;
        initMapping();

        // WASD control
        final Predicate<TwoInputStates> keysHeld = new Predicate<TwoInputStates>() {
            Key[] keys = new Key[] { Key.W, Key.A, Key.S, Key.D, Key.Q, Key.E, Key.R, Key.F, Key.LEFT, Key.RIGHT, Key.UP, Key.DOWN };

            public boolean apply(final TwoInputStates states) {
                for (final Key k : keys) {
                    if (states.getCurrent() != null && states.getCurrent().getKeyboardState().isDown(k)) {
                        return true;
                    }
                }
                return false;
            }
        };

        final TriggerAction moveAction = new TriggerAction() {
            public void perform(final Canvas source, final TwoInputStates inputStates, final double tpf) {
                control.move(source.getCanvasRenderer().getCamera(), inputStates.getCurrent().getKeyboardState(), tpf);
            }
        };
        _keyTrigger = new InputTrigger(keysHeld, moveAction);
        layer.registerTrigger(_keyTrigger);
        
        layer.registerTrigger(new InputTrigger(new AnyKeyCondition(), new TriggerAction() {
            public void perform(final Canvas source, final TwoInputStates inputState, final double tpf) {
            	control.handleKeyboardEvent(source.getCanvasRenderer().getCamera(), inputState.getCurrent().getKeyboardState(), tpf);
                System.out.println("Key character pressed: "
                        + inputState.getCurrent().getKeyboardState().getKeyEvent().getKeyChar());
            }
        }
        ));

        
        return keysHeld;
    }

    public InputTrigger getKeyTrigger() {
        return _keyTrigger;
    }

    public InputTrigger getMouseTrigger() {
        return _mouseTrigger;
    }
}
