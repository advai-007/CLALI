# CLALI Project Report

## 1. Title of the Project

**CLALI: Cognitive Load Adaptive Learning Interface**

## 2. Abstract

CLALI is a web-based adaptive learning platform designed to support students through interactive educational activities while monitoring their engagement and cognitive load in real time. The system combines face-tracking signals, touch and motion behavior, and in-game performance to estimate whether a learner is calm, mildly stressed, highly stressed, distracted, or disengaged. Based on these conditions, the platform dynamically modifies the learning interface by adjusting font style, font size, reading support, visual emphasis, and task assistance. The project provides separate workflows for students and teachers: students access personalized learning games and adaptive reading activities, while teachers manage classes, add students, and review dashboards that summarize engagement and intervention history. By integrating adaptive content delivery with analytics, CLALI aims to improve accessibility, reduce frustration, and create a more responsive digital learning environment.

## 3. Introduction

Traditional digital learning platforms often present the same interface and content style to every student, regardless of their emotional state, focus level, or learning difficulty. This fixed approach may reduce learning effectiveness, especially for young learners who can quickly become distracted, stressed, or disengaged. CLALI addresses this problem by creating an adaptive learning environment that responds to the learner's behavior in real time.

The project is built as an intelligent educational application that observes learner interaction patterns and modifies the interface accordingly. Instead of assuming that all students learn best under identical conditions, CLALI identifies possible signals of cognitive overload or loss of attention and adapts the experience using supportive techniques such as dyslexia-friendly fonts, read-aloud support, bionic reading emphasis, guided assistance, and calming feedback. The system also helps teachers by providing dashboards and analytics that summarize student performance and adaptation history.

## 4. Problem Statement

Many e-learning systems fail to account for the changing mental state of students during learning sessions. Learners may struggle due to stress, fatigue, distraction, or reduced motivation, but conventional systems continue presenting content in the same format. This can negatively affect comprehension, engagement, and task completion.

The goal of this project is to develop a smart adaptive learning platform that can:

- detect signs of stress and distraction using device and face-tracking signals,
- adjust the learning interface dynamically,
- provide child-friendly access and engaging game-based activities,
- and give teachers meaningful analytics to support intervention.

## 5. Objectives

The main objectives of the CLALI project are:

- To design and develop an adaptive digital learning platform for students.
- To monitor student interaction patterns and estimate cognitive state in real time.
- To integrate face tracking, touch behavior, motion data, and gameplay events into one adaptive system.
- To provide supportive interface changes such as font switching, read-aloud, attention guidance, and calming elements.
- To create educational modules that remain engaging while adapting to the learner's needs.
- To provide teacher dashboards for class management and student analysis.
- To store and analyze adaptation events for future monitoring and improvement.

## 6. Scope of the Project

The scope of CLALI includes student login, adaptive learning gameplay, teacher-side class management, real-time sensing, and performance analytics. The current implementation supports:

- student login through class code and visual secret icon,
- teacher login and dashboard access,
- class creation and student registration,
- adaptive reading and story-based learning modules,
- workshop and word-building educational games,
- facial calibration and face-based engagement tracking,
- event logging and analytics through Supabase,
- and responsive browser-based access with PWA support.

## 7. Technologies Used

The project is built using the following technologies:

- **Frontend:** React, TypeScript, Vite
- **Routing:** React Router
- **Animation and UI effects:** Framer Motion
- **State Management:** React Context API
- **Adaptive Logic Engine:** XState
- **Backend and Database:** Supabase
- **Face Tracking:** MediaPipe Tasks Vision
- **3D/Interactive Support:** Three.js, React Three Fiber, Drei
- **Icons and UI Libraries:** Lucide React
- **PWA Support:** Service Worker, Manifest, Offline Page

## 8. System Architecture

CLALI follows a modular client-server architecture. The frontend is responsible for rendering the user interface, handling student and teacher workflows, collecting sensor data, and applying adaptive responses. Supabase acts as the backend service for authentication, storage, and retrieval of learning-related data.

The high-level architecture consists of the following layers:

### 8.1 Presentation Layer

This layer contains the React pages, reusable components, dashboards, game screens, and calibration interfaces. It manages the visual interaction between the user and the system.

### 8.2 Adaptive Sensing Layer

This layer captures raw behavioral and biometric signals such as:

- facial landmarks from the webcam,
- eye aspect ratio for blink estimation,
- head movement and orientation,
- touch events,
- mouse movement,
- scroll activity,
- device motion,
- device orientation,
- and idle state.

### 8.3 Feature Extraction and Normalization Layer

Raw sensor signals are transformed into meaningful features such as frantic taps, scroll reversal patterns, touch pressure, grip behavior, motion magnitude, tilt variance, blink rate, and time on task. These features are normalized into stress and focus scores.

### 8.4 Decision Layer

This layer uses XState machines to determine the learner's current adaptive state. It evaluates thresholds and sustained conditions before switching between states like calm, mild stress, high stress, distracted, and disengaged.

### 8.5 Backend and Analytics Layer

Supabase stores student, teacher, class, and adaptation-event data. Teacher dashboards use this stored information to generate insights such as recent interventions, state distributions, class activity, and student-level logs.

## 9. Database Design

The project uses Supabase tables for structured storage. Important tables include:

- **users:** stores teacher, student, and parent user records
- **classes:** stores classroom information and class codes
- **adaptation_events:** stores adaptive state changes and actions taken during sessions
- **user_baselines:** stores baseline biometric values for users
- **content_versions:** stores content and adaptation-related text versions

These tables help link students to teachers and classes while also maintaining adaptation history for analysis.

## 10. Modules of the Project

The major modules of CLALI are as follows:

### 10.1 Role Selection and Authentication Module

This module allows users to select whether they are a student or a teacher. Teachers log in through standard authentication, while students use a simpler child-friendly flow:

- enter class code,
- select their profile,
- choose their secret icon as a visual password.

This approach improves accessibility for young learners who may not be comfortable using text-based passwords.

### 10.2 Student Dashboard Module

After successful login, the student reaches a dashboard showing available learning activities. The dashboard also displays simple progress indicators such as streaks, sessions played, and performance-related summaries. From here, students can launch different learning games and modules.

### 10.3 Calibration Module

Before starting adaptive activities, students can perform a short face calibration process. During this stage, the system collects facial metrics such as average eye aspect ratio, head pitch, and head yaw to establish a baseline. This baseline improves the reliability of face-based adaptation. If the user skips calibration, fallback mechanisms still allow the system to operate using device interaction data and automatic self-calibration.

### 10.4 Adaptive Reading Module

This module presents story paragraphs and adapts the presentation based on the learner's condition. Depending on the current adaptive state, the system may:

- switch to a dyslexia-friendly font,
- increase text size and spacing,
- enable read-aloud support,
- dim non-active paragraphs,
- apply bionic reading emphasis,
- or display calming guidance.

This module demonstrates the project's core adaptive concept clearly.

### 10.5 Story Demo Module

The story demo provides an interactive narrative experience in which the learner advances through scenes. It tracks success, error patterns, interaction timing, and assist levels. Session logs can later be used to understand how much help was required during the learning experience.

### 10.6 Word Factory Module

This module contains literacy-focused activities such as missing-vowel exercises and word matching. It uses adaptive support levels to reduce task difficulty when needed. For example, the number of choices can be reduced, helpful highlighting can be applied, and maximum assistance can reveal the answer more directly after repeated difficulty.

### 10.7 Workshop Module

The workshop module contains game-like mechanical tasks and uses a dedicated adaptive assistance engine. Based on performance, the system moves between states such as normal, reduced complexity, guided mode, and maximum assist. This allows the learning task to remain challenging while preventing frustration from becoming overwhelming.

### 10.8 Teacher Dashboard Module

The teacher dashboard displays:

- total students,
- recent adaptation events,
- active interventions,
- cognitive load distribution,
- and students requiring attention.

This gives teachers a real-time overview of class performance and learner condition.

### 10.9 Class Management Module

Teachers can create classes, generate class codes, view enrolled students, and remove students if required. This module supports classroom organization and ties student records to the correct teacher.

### 10.10 Student Analysis Module

This module offers detailed student-level insights, including:

- session statistics,
- adaptation counts,
- interaction logs,
- state distribution,
- engagement level,
- and timeline visualization of learning events.

It serves as the main analytics feature of the system.

## 11. Implementation Details

The implementation of CLALI combines modern frontend development with real-time adaptive logic.

The application is developed using React and TypeScript, with Vite used for fast development and bundling. The project is structured into separate folders for pages, components, context providers, hooks, services, utility functions, tracking logic, workers, and game modules. This modular organization improves maintainability and allows new learning modules to be added easily.

Authentication and backend communication are handled using Supabase. The application creates a Supabase client with environment-based configuration and uses service functions to fetch class details, student lists, and performance metrics. Teacher-side features query the backend to generate dashboard summaries and student analysis views. Adaptation events are also inserted into the database during active learning sessions so that teacher dashboards can reflect real learner states.

A key part of the implementation is the face-tracking pipeline. The webcam stream is accessed through the browser and processed with a Web Worker. This worker initializes MediaPipe Face Landmarker and extracts face landmarks without blocking the main user interface. From these landmarks, the system computes eye aspect ratio, head pitch, head yaw, and head roll. These facial signals are then sent back to the main thread for adaptation logic.

The system also captures device interaction signals through a sensor bridge. This bridge listens for touch, mouse, scroll, motion, orientation, visibility, and idle events. These signals are passed into a feature extractor that computes patterns such as frantic repeated taps, scroll direction changes, touch hold duration, average touch pressure, grip intensity, tilt variance, and orientation change rate.

The feature values and facial metrics are combined inside a signal normalizer. This component generates normalized stress and focus scores using weighted logic and smoothing. It also supports self-calibration if a manual baseline is not available. This makes the system more robust and usable in real conditions.

The normalized scores are passed to an XState adaptation machine. The machine decides when the learner should move from one state to another using thresholds and sustained time windows. This prevents unstable rapid switching. Each state maps to a different adaptation configuration. For example:

- **Calm:** standard layout
- **Mild Stress:** larger text, dyslexia-friendly font, read-aloud enabled
- **High Stress:** stronger support and reinforcement
- **Distracted:** inactive content dimmed, bionic reading enabled
- **Disengaged:** stronger assistance and re-engagement support

The same adaptive thinking is also extended into game-specific logic. The reading and workshop modules maintain their own graded assistance mechanisms based on user actions such as correct answers, repeated mistakes, and hint usage. This allows the platform to respond both to biometric signals and to actual task performance.

## 12. Working of the System

The working of CLALI can be described step by step:

1. The user opens the application and selects a role.
2. A student logs in using a class code, avatar, and secret icon, while a teacher logs in through the teacher portal.
3. The student may complete a face calibration step.
4. During activity usage, the system collects webcam-based and device-based interaction data.
5. The feature extraction pipeline calculates behavioral and biometric indicators.
6. These indicators are converted into stress and focus scores.
7. The adaptation engine determines the learner's current state.
8. The interface and task difficulty are modified according to that state.
9. Adaptation events are saved in the database.
10. Teachers can later review dashboards and student analysis logs.

## 13. Detailed Description of the Project

CLALI is designed as a smart learning assistant rather than a static learning application. Its main goal is to improve student experience by recognizing that learning performance is strongly affected by mental state. A child may know how to solve a task but still struggle if the interface is visually demanding, if stress increases, or if focus decreases. CLALI responds to this issue by sensing learner condition and adjusting the content presentation in real time.

The student journey begins with a simple and playful interface. The use of avatars, class codes, and secret icons creates a login flow appropriate for younger users. Once the student enters the system, they are guided to adaptive modules that are both educational and engaging. These modules use animations, interactive gameplay, and visual rewards to maintain interest.

The intelligence of the system lies in its adaptive pipeline. Camera-based facial monitoring provides clues about attention and fatigue. Device interaction signals provide additional behavioral clues that work even when camera access is limited or skipped. The platform does not depend only on one sensor source; instead, it combines multiple indicators to estimate stress and focus more reliably.

When the learner's condition changes, the system does not simply display a warning. Instead, it modifies the learning environment itself. A student who is struggling may receive larger text, simpler visual presentation, stronger guidance, or reduced decision complexity. A distracted learner may see inactive information faded out so attention is pulled back to the important content. A stressed learner may receive read-aloud support or calming prompts. This makes the adaptation practical and directly useful during learning.

On the teacher side, CLALI acts as a classroom insight system. Teachers are not only able to organize students into classes, but also observe which learners are receiving more adaptive support, which students have entered high-stress or disengaged states, and how often interventions occur. The analysis module transforms raw adaptation events into meaningful educational indicators such as engagement level, session count, distribution of states, and recent activity.

In summary, the project combines educational content, biometric and behavioral sensing, adaptive user interface design, and analytics into a single platform. Its strength lies in personalization: instead of giving every child the same learning environment, CLALI attempts to shape the environment according to how the child is currently responding.

## 14. Advantages of the Project

The main advantages of CLALI are:

- Improves accessibility for students with different reading and focus needs.
- Adapts the interface dynamically instead of using a one-size-fits-all approach.
- Combines multiple signals for better understanding of learner condition.
- Provides engaging learning through game-based modules.
- Gives teachers meaningful data for intervention and support.
- Supports child-friendly login and interaction design.
- Works in the browser and can be extended easily with new modules.

## 15. Limitations

Despite its strengths, the current project has some limitations:

- Face tracking depends on camera availability and user permission.
- Biometric interpretation is heuristic-based and may need refinement with larger testing data.
- Environmental factors such as lighting and device quality can affect face tracking accuracy.
- Real classroom deployment may require stronger validation, privacy policies, and security hardening.

## 16. Future Enhancements

The following improvements can be added in the future:

- Development of a full parent dashboard
- Integration of more adaptive educational modules
- Machine learning models for more accurate cognitive-state prediction
- Speech analysis for emotion and engagement detection
- Personalized long-term learner profiles and recommendations
- Exportable reports for teachers and schools
- Multi-language support
- Stronger offline learning capabilities

## 17. Conclusion

CLALI is an innovative adaptive learning platform that combines educational gameplay, accessibility support, biometric sensing, and teacher analytics in a single web application. The project demonstrates how modern web technologies can be used to build a responsive learning environment that changes according to the learner's stress, focus, and interaction patterns. By providing real-time support to students and meaningful insights to teachers, CLALI moves beyond static e-learning and toward a more personalized educational experience. The project has strong potential for further development in smart education, assistive technology, and learner-centered interface design.

## 18. References

- React Documentation
- TypeScript Documentation
- Vite Documentation
- Supabase Documentation
- MediaPipe Tasks Vision Documentation
- XState Documentation


# Detailed project description

## Implementation Details

The project is implemented as a frontend web application using React, TypeScript, and Vite. The user interface is built with reusable components and animated using Framer Motion, while routing is handled with React Router. State-driven adaptive behavior is implemented using XState, which allows the system to transition between learning states such as calm, mildStress, highStress, distracted, and disengaged.

For backend services, the application uses Supabase. Supabase stores user profiles, teacher-class relationships, student records, class codes, and adaptation events. The database supports role-based access for teachers, students, and parents, although the parent dashboard is still minimal in the current implementation. Teachers can create classes, generate class codes, add students, and view aggregated analytics. Students log in using a class code, select their profile, and authenticate with a visual secret icon instead of a text password, making the login flow more child-friendly.

A major technical feature of the project is the adaptive sensing pipeline. MediaPipe face landmark detection runs through a Web Worker so that facial analysis does not block the main UI thread. The system extracts metrics such as Eye Aspect Ratio for blink estimation, head yaw, pitch, and roll for attention tracking, and combines them with device interaction signals including touch pressure, frantic taps, scroll reversals, motion intensity, device orientation changes, and idle time. These raw signals are processed by feature extraction and normalization modules, which convert them into stress and focus scores.

The normalized scores are passed into an XState-based adaptation engine. This engine uses threshold-based and sustained-duration logic to avoid sudden unstable transitions. When the learner’s state changes, the interface is adapted automatically. For example, the system may enable dyslexia-friendly fonts, activate read-aloud support, dim inactive paragraphs, apply bionic reading emphasis, or present calming and guidance elements. Adaptation events are also logged to Supabase so that teachers can review student sessions later.

The application includes multiple learning modules. The reading module presents story content that changes its presentation according to learner state. The story demo module offers guided narrative interaction with completion logging. The Word Factory module provides reading exercises such as missing-vowel tasks and progressively adjusts support levels based on performance. The workshop module includes game-like mechanical tasks and uses a separate adaptive assistance model that shifts between normal, reduced complexity, guided, and maximum assist modes depending on errors and difficulty. The system also includes calibration support, where students can establish a facial baseline before starting activities; if calibration is skipped, fallback behavior still allows adaptation using available signals.

The project also includes PWA-related assets such as a service worker, offline page, icons, and manifest files. This improves deployability and supports smoother usage on tablets and mobile devices, which is important because the platform relies on touch and motion data in addition to camera input.

## Detailed Description of the Project

CLALI is an intelligent educational platform built to make digital learning more supportive, personalized, and inclusive. The core idea behind the project is that children do not always learn effectively under a fixed interface. Some students may become distracted, some may experience stress, and others may need accessibility support such as larger text, structured guidance, or audio reinforcement. Instead of waiting for a teacher to notice these difficulties manually, CLALI attempts to sense them automatically and respond in real time.

The system begins with a role-based entry flow. Teachers use a standard login and access management features, while students use a simplified login experience based on class code, avatar selection, and a visual secret icon. This design reduces the complexity of authentication for young learners. After login, a student may complete a short camera calibration step to establish baseline facial measurements. These baseline values help the platform detect deviations that may indicate fatigue, loss of focus, or stress.

Once the learner enters the student dashboard, they can launch interactive modules such as the adaptive story demo, the reading activities, the Word Factory reading game, and the workshop game. Each module is not only educational but also adaptive. As the student interacts with the content, the platform monitors behavior continuously. The face-tracking layer observes blinking and head orientation, while the sensor layer records touch movement, device handling, idle periods, and interaction patterns. In parallel, the learning tasks track correct answers, incorrect answers, response timing, and user hesitation.

All of these signals are fused into a decision-making layer that estimates the learner’s current state. If the student appears calm and focused, the platform keeps the interface in its normal form. If mild stress is detected, the interface may switch to an easier reading style with dyslexia-friendly fonts and read-aloud assistance. If attention begins to drop, the system may fade less important elements and visually emphasize the active content. If the learner appears highly stressed or disengaged, the platform can move toward more guided support. This creates a feedback loop in which the application continuously adapts itself to the learner instead of forcing the learner to adapt to the application.

The teacher side of the system extends this adaptive philosophy into analytics and classroom management. Teachers can create classes, generate class codes, register students, and assign visual identifiers such as avatars and secret icons. They can then monitor student activity through a dashboard that summarizes adaptation events, cognitive-load distribution, recent interventions, and students who may require attention. A deeper student analysis page presents timeline-style logs of adaptation events, state breakdowns, session counts, and engagement estimates. This gives teachers both a live overview and a historical view of how students are responding to digital learning activities.

Overall, CLALI can be described as a smart adaptive learning environment that blends educational games, accessibility support, sensor-based behavioral monitoring, and teacher analytics into one platform. Its main contribution is not just delivering content, but delivering the right form of content at the right time based on the learner’s condition. This makes the project highly relevant for personalized education, early intervention, and child-friendly human-computer interaction.