import os
import cv2
import json
import numpy as np
from tqdm import tqdm
import mediapipe as mp

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands

pose_model = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
hand_model = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

base_dir = "../data/signs/"

words = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
bar = tqdm(total=len(words), desc="Converting Videos to Points")

for word in words:
    try:
        video_path = f"{base_dir}{word}/{word}.mp4"
        if not os.path.exists(video_path):
            print(f"Video not found for {word}")
            continue

        data = []
        frame_number = 0

        capture = cv2.VideoCapture(video_path)
        if not capture.isOpened():
            print(f"Failed to open {video_path}")
            continue

        while capture.isOpened():
            success, frame = capture.read()
            if not success:
                break

            frame = cv2.resize(frame, (640, 480))
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            pose_results = pose_model.process(frame_rgb)
            hand_results = hand_model.process(frame_rgb)

            frame_number += 1
            point = {
                "frame_number": frame_number,
                "pose_landmarks": [],
                "hands": [[], []]
            }

            if pose_results.pose_landmarks:
                for i, landmark in enumerate(pose_results.pose_landmarks.landmark):
                    point["pose_landmarks"].append({
                        "id": i,
                        "x": float(landmark.x),
                        "y": float(landmark.y),
                        "z": float(landmark.z),
                        "visibility": float(landmark.visibility)
                    })
            else:
                point["pose_landmarks"] = [{"id": i, "x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.0} for i in range(33)]

            if hand_results.multi_hand_landmarks and hand_results.multi_handedness:
                for idx, (landmarks, handedness) in enumerate(zip(hand_results.multi_hand_landmarks, hand_results.multi_handedness)):
                    hand_label = handedness.classification[0].label
                    hand_idx = 0 if hand_label == "Left" else 1
                    for i, landmark in enumerate(landmarks.landmark):
                        point["hands"][hand_idx].append({
                            "id": i,
                            "x": float(landmark.x),
                            "y": float(landmark.y),
                            "z": float(landmark.z)
                        })
                for h in range(2):
                    if not point["hands"][h]:
                        point["hands"][h] = [{"id": i, "x": 0.0, "y": 0.0, "z": 0.0} for i in range(21)]
            else:
                point["hands"] = [[{"id": i, "x": 0.0, "y": 0.0, "z": 0.0} for i in range(21)] for _ in range(2)]

            data.append(point)

        capture.release()

        json_path = f"{base_dir}{word}/{word}.json"
        with open(json_path, "w") as f:
            json.dump({"word": word, "points": data}, f, indent=2)

        bar.update(1)

    except Exception as e:
        print(f"Error processing {word}: {e}")
        continue

bar.close()
print("Dataset creation complete. JSON files stored in ../data/signs/")