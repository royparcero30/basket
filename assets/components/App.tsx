import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const BALL_SIZE = 60;
const BACKBOARD_WIDTH = 200;
const RING_WIDTH = 70;
const BUTTON_BOTTOM = 40;
const BUTTON_HEIGHT = 56;
const INITIAL_BALL_Y = screenHeight - BUTTON_BOTTOM - BUTTON_HEIGHT - BALL_SIZE - 10;
const MAX_MISS = 3;
const LEADERBOARD_SIZE = 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23243a', // Modern deep blue
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    elevation: 4,
  },
  score: {
    fontSize: 32,
    marginLeft: 10,
    marginRight: 10,
    color: '#ffe082',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resetButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  backboard: {
    position: 'absolute',
    width: 200,
    height: 100,
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#ff9800',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    width: 70,
    height: 25,
    borderWidth: 5,
    borderColor: 'black',
    borderRadius: 50,
    borderBottomWidth: 0,
    backgroundColor: 'red',
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  ball: {
    position: 'absolute',
    width: 50,
    height: 50,
    resizeMode: 'contain',
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 6,
  },
  slider: {
    width: 220,
    height: 40,
    position: 'absolute',
    bottom: 110,
    left: 20,
    zIndex: 10,
  },
  sliderLabel: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    width: 220,
    textAlign: 'left',
    color: '#ffe082',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,60,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardModal: {
    width: 320,
    backgroundColor: '#fffbe6',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  leaderboardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#ff9800',
    textShadowColor: '#fff3e0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardScore: {
    fontSize: 18,
    marginVertical: 3,
    color: '#222',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  leaderboardEmpty: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
    marginTop: 16,
  },
  leaderboardButton: {
    marginTop: 22,
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    elevation: 4,
  },
  leaderboardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 8,
    width: 200,
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#222',
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    marginBottom: 2,
    fontWeight: 'bold',
  },
});

function getBoardSpeed(score: number) {
  if (score < 5) return 0;
  return 2 + Math.floor((score - 5) / 5) * 2;
}

type LeaderboardEntry = { name: string; score: number };

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
  const [power, setPower] = useState<number>(32);
  const [boardLeft, setBoardLeft] = useState<number>((screenWidth - BACKBOARD_WIDTH) / 2);
  const [boardDirection, setBoardDirection] = useState<1 | -1>(1);

  const [missCount, setMissCount] = useState<number>(0);

  // Leaderboard and modal state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState<string>('');

  const velocityXRef = useRef(velocityX);
  const velocityYRef = useRef(velocityY);
  const ballXRef = useRef(ballX);
  const ballYRef = useRef(ballY);
  const draggingRef = useRef(false);

  const hoopY = 100 + 70;
  const hoopX = boardLeft + (BACKBOARD_WIDTH - RING_WIDTH) / 2;

  useEffect(() => { velocityXRef.current = velocityX; }, [velocityX]);
  useEffect(() => { velocityYRef.current = velocityY; }, [velocityY]);
  useEffect(() => { ballXRef.current = ballX; }, [ballX]);
  useEffect(() => { ballYRef.current = ballY; }, [ballY]);

  // Load leaderboard on mount
  useEffect(() => {
    AsyncStorage.getItem('leaderboard').then(data => {
      if (data) setLeaderboard(JSON.parse(data));
    });
  }, []);

  // Save score to leaderboard if it's a new high score
  const tryUpdateLeaderboard = async (newScore: number) => {
    // Check if qualifies for leaderboard
    let newBoard = [...leaderboard, { name: '', score: newScore }]
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE);

    // If newScore is in the leaderboard and name is empty, ask for name
    const index = newBoard.findIndex(e => e.score === newScore && e.name === '');
    if (index !== -1) {
      setPendingScore(newScore);
      setShowNameInput(true);
    } else {
      setShowLeaderboard(true);
    }
  };

  // Actually save the name and update leaderboard
  const savePlayerName = async () => {
    if (!playerName.trim() || pendingScore === null) return;
    let newBoard = [...leaderboard, { name: playerName.trim(), score: pendingScore }]
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE);
    setLeaderboard(newBoard);
    await AsyncStorage.setItem('leaderboard', JSON.stringify(newBoard));
    setShowNameInput(false);
    setShowLeaderboard(true);
    setPlayerName('');
    setPendingScore(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBoardLeft((prev) => {
        const speed = getBoardSpeed(score);
        if (speed === 0) return prev;
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
    }, 16);
    return () => clearInterval(interval);
  }, [boardDirection, score]);

  const aimAndShoot = () => {
    if (
      ballYRef.current >= INITIAL_BALL_Y &&
      velocityYRef.current === 0
    ) {
      const ringCenterX = hoopX + RING_WIDTH / 2 - BALL_SIZE / 2;
      const ringCenterY = hoopY - BALL_SIZE / 2;
      const dx = ringCenterX - ballXRef.current;
      const dy = ringCenterY - ballYRef.current;
      const t = power;
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
          gestureState.vy < -0.3
        ) {
          const ringCenterX = hoopX + RING_WIDTH / 2 - BALL_SIZE / 2;
          const ringCenterY = hoopY - BALL_SIZE / 2;
          const dx = ringCenterX - ballXRef.current;
          const dy = ringCenterY - ballYRef.current;
          const t = power;
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
      setVelocityX((prevVX) => (Math.abs(prevVX) > 0.1 ? prevVX * 0.985 : 0));
      setVelocityY((prevVY) => {
        if (ballYRef.current < INITIAL_BALL_Y || prevVY !== 0) {
          return prevVY + 0.12;
        }
        return 0;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Score and reset miss count on hit
  useEffect(() => {
    if (
      ballY < hoopY + 10 &&
      ballY > hoopY - 30 &&
      !scored &&
      ballX + BALL_SIZE / 2 > hoopX &&
      ballX + BALL_SIZE / 2 < hoopX + RING_WIDTH
    ) {
      setScore((prev) => prev + 1);
      setScored(true);
      setMissCount(0); // Reset miss count on score
    }
  }, [ballY, scored, ballX, hoopX]);

  // Miss logic: if ball lands and didn't score, increment missCount and reset after 3 misses
  useEffect(() => {
    if (
      ballY === INITIAL_BALL_Y &&
      velocityY === 0 &&
      !scored
    ) {
      setMissCount((prev) => {
        const nextMiss = prev + 1;
        if (nextMiss >= MAX_MISS) {
          if (score > 0) tryUpdateLeaderboard(score);
          setScore(0); // Reset score after 3 misses
          return 0;    // Reset miss count
        }
        return nextMiss;
      });
    }
  }, [ballY, velocityY, scored]);

  const resetBall = (): void => {
    setBallX((screenWidth - BALL_SIZE) / 2);
    setBallY(INITIAL_BALL_Y);
    setVelocityX(0);
    setVelocityY(0);
    setScored(false);
  };

  const resetGame = () => {
    setScore(0);
    setMissCount(0);
    setBoardLeft((screenWidth - BACKBOARD_WIDTH) / 2);
    setBoardDirection(1);
    resetBall();
    setShowLeaderboard(false);
    setShowNameInput(false);
    setPlayerName('');
    setPendingScore(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#23243a" />
      {/* Leaderboard Modal */}
      <Modal
        visible={showLeaderboard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.leaderboardModalOverlay}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.leaderboardTitle}>🏆 Leaderboard 🏆</Text>
            {leaderboard.length === 0 ? (
              <Text style={styles.leaderboardEmpty}>No scores yet.</Text>
            ) : (
              leaderboard.map((entry, idx) => (
                <Text key={idx} style={[
                  styles.leaderboardScore,
                  idx === 0 && { color: '#ffd600', fontSize: 22 },
                  idx === 1 && { color: '#bdbdbd' },
                  idx === 2 && { color: '#ffb300' },
                ]}>
                  {idx + 1}. {entry.name || 'Anonymous'} - {entry.score}
                </Text>
              ))
            )}
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => setShowLeaderboard(false)}
            >
              <Text style={styles.leaderboardButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Name Input Modal */}
      <Modal
        visible={showNameInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameInput(false)}
      >
        <KeyboardAvoidingView
          style={styles.leaderboardModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.leaderboardModal}>
            <Text style={styles.leaderboardTitle}>New High Score!</Text>
            <Text style={styles.inputLabel}>Enter your name:</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Your name"
              maxLength={16}
              autoFocus
              onSubmitEditing={savePlayerName}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={savePlayerName}
            >
              <Text style={styles.leaderboardButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetButtonText}>Reset Score</Text>
        </TouchableOpacity>
        <Text style={styles.score}>Score: {score}</Text>
      </View>
      {/* Miss counter at top right */}
      <Text style={{
        position: 'absolute',
        top: 10,
        right: 20,
        fontSize: 20,
        color: '#ff5252',
        fontWeight: 'bold',
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        overflow: 'hidden',
        elevation: 2,
      }}>
        Miss: {missCount}/{MAX_MISS}
      </Text>
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
          left: screenWidth / 2 - 80,
          backgroundColor: '#ff9800',
          padding: 18,
          borderRadius: 32,
          zIndex: 10,
          elevation: 6,
          shadowColor: '#ff9800',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
        onPress={aimAndShoot}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>Aim & Shoot</Text>
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
          { top: ballY, left: ballX },
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