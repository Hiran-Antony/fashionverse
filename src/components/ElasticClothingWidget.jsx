import { useEffect, useRef } from 'react';

export default function ElasticClothingWidget() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const shirtBodyRef = useRef(null);
  const pantsBodyRef = useRef(null);
  const isDraggingRef = useRef(false);
  const mouseConstraintRef = useRef(null);

  useEffect(() => {
    // Import Matter.js dynamically
    import('matter-js').then(MatterModule => {
      const Matter = MatterModule.default || MatterModule;

      const { 
        Engine, Render, Runner, 
        Bodies, Body, Composite, 
        Mouse, MouseConstraint,
        Events, Constraint
      } = Matter;

      // Create engine
      const engine = Engine.create({
        gravity: { x: 0, y: 0.3 }
      });
      engineRef.current = engine;

      const canvas = canvasRef.current;
      const W = 500;
      const H = 500;

      // Create renderer
      const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
          width: W,
          height: H,
          background: 'transparent',
          wireframes: false,
        }
      });

      // ANCHOR POINTS (fixed to canvas, offset by +50x, +50y)
      // Original left was 65,8 -> now 115,58
      // Original right was 125,8 -> now 175,58
      const anchorShirt = Bodies.circle(
        115, 58, 4,
        { 
          isStatic: true,
          render: { 
            fillStyle: '#C9973A',
            strokeStyle: '#E8B84B',
            lineWidth: 1,
          }
        }
      );

      const anchorPants = Bodies.circle(
        175, 58, 4,
        {
          isStatic: true,
          render: {
            fillStyle: '#C9973A',
            strokeStyle: '#E8B84B',
            lineWidth: 1,
          }
        }
      );

      // SHIRT BODY (hanging object)
      // Original 65, 100 -> 115, 150
      const shirt = Bodies.rectangle(
        115, 150, 55, 70,
        {
          restitution: 0.7,
          friction: 0.1,
          frictionAir: 0.08,
          render: {
            fillStyle: 'transparent',
            strokeStyle: 'transparent'
          }
        }
      );
      shirtBodyRef.current = shirt;

      // PANTS BODY (hanging object)
      // Original 125, 130 -> 175, 180
      const pants = Bodies.rectangle(
        175, 180, 45, 80,
        {
          restitution: 0.7,
          friction: 0.1,
          frictionAir: 0.08,
          render: {
            fillStyle: 'transparent',
            strokeStyle: 'transparent'
          }
        }
      );
      pantsBodyRef.current = pants;

      // ELASTIC CONSTRAINTS (spring effect)
      const shirtSpring = Constraint.create({
        pointA: { x: 115, y: 58 },
        bodyB: shirt,
        pointB: { x: 0, y: -35 },
        length: 30,
        stiffness: 0.05,
        damping: 0.1,
        render: {
          strokeStyle: '#C9973A',
          lineWidth: 1.5,
          type: 'line',
          anchors: false,
        }
      });

      const pantsSpring = Constraint.create({
        pointA: { x: 175, y: 58 },
        bodyB: pants,
        pointB: { x: 0, y: -40 },
        length: 30,
        stiffness: 0.05,
        damping: 0.1,
        render: {
          strokeStyle: '#C9973A',
          lineWidth: 1.5,
          type: 'line',
          anchors: false,
        }
      });

      // BOUNDARIES
      const ground = Bodies.rectangle(
        250, 480, 600, 20,
        { isStatic: true, render: { visible: false } }
      );
      const wallLeft = Bodies.rectangle(
        0, 250, 20, 500,
        { isStatic: true, render: { visible: false } }
      );
      const wallRight = Bodies.rectangle(
        500, 250, 20, 500,
        { isStatic: true, render: { visible: false } }
      );

      // MOUSE INTERACTION
      const mouse = Mouse.create(canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          damping: 0.1,
          render: { visible: false }
        }
      });
      mouseConstraintRef.current = mouseConstraint;

      // Add everything to world
      Composite.add(engine.world, [
        anchorShirt, anchorPants,
        shirt, pants,
        shirtSpring, pantsSpring,
        ground, wallLeft, wallRight,
        mouseConstraint,
      ]);

      // Custom SVG Renderer for Shirt and Pants
      Events.on(render, 'afterRender', () => {
        const ctx = canvas.getContext('2d');
        
        // --- DRAW SHIRT ---
        const sx = shirt.position.x;
        const sy = shirt.position.y;
        const sa = shirt.angle;
        
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sa);
        
        // Gold stroke shirt shape
        ctx.strokeStyle = '#C9973A';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(201,151,58,0.13)'; // matching user's updated request for slightly darker fill
        
        ctx.beginPath();
        // Top collar
        ctx.moveTo(-8, -32);
        ctx.lineTo(8, -32);
        // Right shoulder to sleeve
        ctx.lineTo(26, -26);
        ctx.lineTo(30, -12);
        ctx.lineTo(22, -10);
        // Right body
        ctx.lineTo(22, 32);
        // Bottom
        ctx.lineTo(-22, 32);
        // Left body
        ctx.lineTo(-22, -10);
        ctx.lineTo(-30, -12);
        ctx.lineTo(-26, -26);
        // Back to collar
        ctx.lineTo(-8, -32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        // --- DRAW PANTS ---
        const px = pants.position.x;
        const py = pants.position.y;
        const pa = pants.angle;
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(pa);
        
        ctx.strokeStyle = '#E8B84B';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(201,151,58,0.09)'; // matching user's updated request
        
        ctx.beginPath();
        // Waistband
        ctx.moveTo(-24, -38);
        ctx.lineTo(24, -38);
        // Right side down
        ctx.lineTo(24, -20);
        // Right leg
        ctx.lineTo(20, -20);
        ctx.lineTo(20, 38);
        // Between legs
        ctx.lineTo(4, 38);
        ctx.lineTo(4, -10);
        ctx.lineTo(-4, -10);
        // Left leg
        ctx.lineTo(-4, 38);
        ctx.lineTo(-20, 38);
        ctx.lineTo(-20, -20);
        // Left waist
        ctx.lineTo(-24, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Belt line detail
        ctx.beginPath();
        ctx.moveTo(-24, -28);
        ctx.lineTo(24, -28);
        ctx.strokeStyle = 'rgba(201,151,58,0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        
        ctx.restore();
      });

      // Track drag state
      Events.on(mouseConstraint, 'startdrag', () => {
        isDraggingRef.current = true;
      });

      Events.on(mouseConstraint, 'enddrag', () => {
        isDraggingRef.current = false;
      });

      // Start renderer and runner
      const runner = Runner.create();
      Render.run(render);
      Runner.run(runner, engine);

      // Initial gentle swing animation
      setTimeout(() => {
        if (shirt) Body.applyForce(shirt, shirt.position, { x: 0.003, y: 0 });
        if (pants) Body.applyForce(pants, pants.position, { x: -0.003, y: 0 });
      }, 500);

      // Extra Interactions
      const handleDblClick = () => {
        const s = shirtBodyRef.current;
        const p = pantsBodyRef.current;
        if (s && p) {
          Body.applyForce(s, s.position, { 
            x: (Math.random()-0.5) * 0.02,
            y: -0.015 
          });
          Body.applyForce(p, p.position, {
            x: (Math.random()-0.5) * 0.02,
            y: -0.015
          });
        }
      };

      const handleMouseEnter = () => {
        const s = shirtBodyRef.current;
        if (s) {
          Body.applyForce(s, s.position, { x: 0.002, y: 0 });
        }
      };

      canvas.addEventListener('dblclick', handleDblClick);
      canvas.addEventListener('mouseenter', handleMouseEnter);

      // Cleanup
      return () => {
        canvas.removeEventListener('dblclick', handleDblClick);
        canvas.removeEventListener('mouseenter', handleMouseEnter);
        Render.stop(render);
        Runner.stop(runner);
        Engine.clear(engine);
      };
    }).catch(err => console.error("Failed to load matter-js", err));
  }, []);

  return (
    <div className="elastic-widget elastic-widget-wrap" style={{
      position: 'fixed',
      top: '70px',
      left: '0',
      width: '200px',
      height: '350px',
      zIndex: 50,
      pointerEvents: 'none',
      overflow: 'visible',
    }}>
      {/* Hanger rail at top (offset by +50 since canvas is -50) 
          Original top was 4px, left 20px in a 180px box.
          We want it relative to the visual container still, so we don't offset this. */}
      <div style={{
        position: 'absolute',
        top: '4px',
        left: '20px',
        right: '20px',
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #C9973A, #E8B84B, #C9973A, transparent)',
        borderRadius: '2px',
        zIndex: 2,
      }} />

      {/* Physics canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '500px',
          height: '500px',
          cursor: 'grab',
          pointerEvents: 'auto',
          overflow: 'visible',
          zIndex: 1,
        }}
      />
    </div>
  );
}
