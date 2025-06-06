import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const BALL_SIZE = 60;
const BACKBOARD_WIDTH = 200;
const RING_WIDTH = 70;
const BUTTON_BOTTOM = 40;
const BUTTON_HEIGHT = 56; // 16 padding top + 16 padding bottom + ~24 text
const INITIAL_BALL_Y = screenHeight - BUTTON_BOTTOM - BUTTON_HEIGHT - BALL_SIZE - 10; // 10px gap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  score: {
    fontSize: 30,
    marginLeft: 10,
    marginRight: 10,
  },
  resetButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backboard: {
    position: 'absolute',
    width: 200,
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ring: {
    position: 'absolute',
    width: 70,
    height: 25,
    borderWidth: 5,
    borderColor: 'orange',
    borderRadius: 50,
    borderBottomWidth: 0,
    backgroundColor: 'red',
  },
  ball: {
    position: 'absolute',
    width: 50,
    height: 50,
    resizeMode: 'contain',
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slider: {
    width: 200,
    height: 40,
    position: 'absolute',
    bottom: 100,
    left: 20, // moved to left corner
    zIndex: 10,
  },
  sliderLabel: {
    position: 'absolute',
    bottom: 140,
    left: 20, // moved to left corner
    width: 200,
    textAlign: 'left', // align text to left
    color: '#333',
    fontWeight: 'bold',
  },
});

function getBoardSpeed(score: number) {
  if (score < 5) return 0; // Not moving until score is 5
  // At score 5, move slowly (speed = 2)
  // Every +5 after 5, increase speed by 2 (so 2, 4, 6, 8, ...)
  return 2 + Math.floor((score - 5) / 5) * 2;
}

export default function App(): JSX.Element {
  const [ballX, setBallX] = useState<number>((screenWidth - BALL_SIZE) / 2);
  const [ballY, setBallY] = useState<number>(INITIAL_BALL_Y);
  const startXRef = useRef(ballX);
  const startYRef = useRef(ballY);
  const [velocityX, setVelocityX] = useState<number>(0);
  const [velocityY, setVelocityY] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [scored, setScored] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [power, setPower] = useState<number>(32); // Adjustable power
  const [boardLeft, setBoardLeft] = useState<number>((screenWidth - BACKBOARD_WIDTH) / 2);
  const [boardDirection, setBoardDirection] = useState<1 | -1>(1); // 1 = right, -1 = left

  const velocityXRef = useRef(velocityX);
  const velocityYRef = useRef(velocityY);
  const ballXRef = useRef(ballX);
  const ballYRef = useRef(ballY);
  const draggingRef = useRef(false);

  // Calculate hoopX and ring position based on boardLeft
  const hoopY = 100 + 70;
  const hoopX = boardLeft + (BACKBOARD_WIDTH - RING_WIDTH) / 2;

  useEffect(() => { velocityXRef.current = velocityX; }, [velocityX]);
  useEffect(() => { velocityYRef.current = velocityY; }, [velocityY]);
  useEffect(() => { ballXRef.current = ballX; }, [ballX]);
  useEffect(() => { ballYRef.current = ballY; }, [ballY]);

  // Auto-move board left and right, speed depends on score
  useEffect(() => {
    const interval = setInterval(() => {
      setBoardLeft((prev) => {
        const speed = getBoardSpeed(score);
        if (speed === 0) return prev; // Don't move if speed is 0
        let next = prev + speed * boardDirection;
        if (next <= 0) {
          setBoardDirection(1);
          next = 0;
        }
        if (next >= screenWidth - BACKBOARD_WIDTH) {
          setBoardDirection(-1);
          next = screenWidth - BACKBOARD_WIDTH;
        }
        return next;
      });
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, [boardDirection, score]);

  // Aim & Shoot button handler with adjustable power
  const aimAndShoot = () => {
    if (
      ballYRef.current >= INITIAL_BALL_Y &&
      velocityYRef.current === 0
    ) {
      const ringCenterX = hoopX + RING_WIDTH / 2 - BALL_SIZE / 2;
      const ringCenterY = hoopY - BALL_SIZE / 2;
      const dx = ringCenterX - ballXRef.current;
      const dy = ringCenterY - ballYRef.current;
      const t = power; // Use slider value
      const gravity = 0.12;
      const vx = dx / t;
      const vy = (dy - 0.5 * gravity * t * t) / t;
      setVelocityX(vx);
      setVelocityY(vy);
      setScored(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        return (
          locationX >= 0 &&
          locationX <= BALL_SIZE &&
          locationY >= 0 &&
          locationY <= BALL_SIZE &&
          velocityYRef.current === 0 &&
          ballYRef.current >= INITIAL_BALL_Y
        );
      },
      onPanResponderGrant: () => {
        setDragging(true);
        draggingRef.current = true;
        startXRef.current = ballXRef.current;
        startYRef.current = ballYRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (
          draggingRef.current &&
          velocityYRef.current === 0 &&
          ballYRef.current >= INITIAL_BALL_Y
        ) {
          const newX = startXRef.current + gestureState.dx;
          const newY = startYRef.current + gestureState.dy;
          setBallX(newX);
          setBallY(newY);
          ballXRef.current = newX;
          ballYRef.current = newY;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setDragging(false);
        draggingRef.current = false;
        if (
          ballYRef.current >= INITIAL_BALL_Y &&
          velocityYRef.current === 0 &&
          gestureState.vy < -0.3 // upward swipe
        ) {
          // Calculate the center of the ring
          const ringCenterX = hoopX + RING_WIDTH / 2 - BALL_SIZE / 2;
          const ringCenterY = hoopY - BALL_SIZE / 2;
          const dx = ringCenterX - ballXRef.current;
          const dy = ringCenterY - ballYRef.current;
          const t = power; // Use slider value for swipe too
          const gravity = 0.12;
          const vx = dx / t;
          const vy = (dy - 0.5 * gravity * t * t) / t;
          setVelocityX(vx);
          setVelocityY(vy);
          setScored(false);
        } else {
          setBallX((screenWidth - BALL_SIZE) / 2);
          setBallY(INITIAL_BALL_Y);
          ballXRef.current = (screenWidth - BALL_SIZE) / 2;
          ballYRef.current = INITIAL_BALL_Y;
        }
      },
    })
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setBallX((prevX) => {
        let nextX = prevX + velocityXRef.current;
        if (nextX < 0) {
          nextX = 0;
          setVelocityX((v) => -v * 0.6);
        }
        if (nextX > screenWidth - BALL_SIZE) {
          nextX = screenWidth - BALL_SIZE;
          setVelocityX((v) => -v * 0.6);
        }
        return nextX;
      });
      setBallY((prevY) => {
        let nextY = prevY + velocityYRef.current;
        if (nextY <= 0) {
          nextY = 0;
          setVelocityY((v) => -v * 0.5);
        }
        // Bounce effect on ground
        if (nextY >= INITIAL_BALL_Y) {
          nextY = INITIAL_BALL_Y;
          if (Math.abs(velocityYRef.current) > 6) {
            setVelocityY((v) => -v * 0.4);
          } else {
            setVelocityY(0);
            setVelocityX(0);
            if (velocityYRef.current !== 0) resetBall();
          }
        }
        return nextY;
      });
      // Air friction
      setVelocityX((prevVX) => (Math.abs(prevVX) > 0.1 ? prevVX * 0.985 : 0));
      // Gravity
      setVelocityY((prevVY) => {
        if (ballYRef.current < INITIAL_BALL_Y || prevVY !== 0) {
          return prevVY + 0.12;
        }
        return 0;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      ballY < hoopY + 10 &&
      ballY > hoopY - 30 &&
      velocityY < 0 &&
      !scored &&
      ballX + BALL_SIZE / 2 > hoopX &&
      ballX + BALL_SIZE / 2 < hoopX + RING_WIDTH
    ) {
      setScore((prev) => prev + 1);
      setScored(true);
    }
  }, [ballY, velocityY, scored, ballX, hoopX]);

  const resetBall = (): void => {
    setBallX((screenWidth - BALL_SIZE) / 2);
    setBallY(INITIAL_BALL_Y);
    setVelocityX(0);
    setVelocityY(0);
    setScored(false);
  };

  // Reset score and board/ball positions
  const resetGame = () => {
    setScore(0);
    setBoardLeft((screenWidth - BACKBOARD_WIDTH) / 2);
    setBoardDirection(1);
    resetBall();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetButtonText}>Reset Score</Text>
        </TouchableOpacity>
        <Text style={styles.score}>Score: {score}</Text>
      </View>
      <Text style={styles.sliderLabel}>Adjust Power (Arc): {power}</Text>
      <Slider
        style={styles.slider}
        minimumValue={20}
        maximumValue={50}
        step={1}
        value={power}
        minimumTrackTintColor="#ff9800"
        maximumTrackTintColor="#ddd"
        thumbTintColor="#ff9800"
        onValueChange={setPower}
      />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: BUTTON_BOTTOM,
          left: screenWidth / 2 - 70,
          backgroundColor: '#ff9800',
          padding: 16,
          borderRadius: 30,
          zIndex: 10,
        }}
        onPress={aimAndShoot}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Aim & Shoot</Text>
      </TouchableOpacity>
      <View
        style={[
          styles.backboard,
          {
            top: 100,
            left: boardLeft,
          },
        ]}
      >
        <View
          style={[
            styles.ring,
            {
              top: 70,
              left: (BACKBOARD_WIDTH - RING_WIDTH) / 2,
            },
          ]}
        />
      </View>
      {/* Ball centered above the Aim & Shoot button */}
      <View
        style={[
          styles.ball,
          { top: ballY, left: screenWidth / 2 - BALL_SIZE / 2 },
        ]}
        {...panResponder.panHandlers}
      >
        <Image
          source={require('../basketball.png')}
          style={{ width: 60, height: 70, resizeMode: 'contain' }}
        />
      </View>
    </View>
  );
}