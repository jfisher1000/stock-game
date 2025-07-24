Project Architecture & Design Notes
This document outlines the core architectural decisions, technology stack, and important setup notes for the Virtual Stock Market Game application.

1. Overview

The project is a web application that allows users to participate in virtual stock trading competitions. It is built using a modern JavaScript stack, leveraging the Firebase platform for its backend services to enable real-time features and scalability.

2. Technology Stack

Frontend Framework: React

Reasoning: Chosen for its component-based architecture, which is ideal for building a complex and interactive user interface. Its large ecosystem and community support make development faster and more manageable.

Styling: Tailwind CSS

Reasoning: A utility-first CSS framework that allows for rapid UI development directly within the HTML/JSX, ensuring a consistent and modern design system without writing custom CSS.

Backend-as-a-Service (BaaS): Google Firebase

Reasoning: Provides a comprehensive suite of tools that are tightly integrated, reducing the need for managing separate backend infrastructure. This is ideal for rapid development and scaling.

3. Core Firebase Services

Authentication: Firebase Authentication

Function: Manages all user sign-up, login, and session management using email and password.

Reasoning: Provides a secure and easy-to-implement solution for user identity, which is crucial for a multi-user application.

Database: Cloud Firestore

Function: A NoSQL, document-based database used to store all application data, including user profiles, competitions, participant portfolios, and market data.

Reasoning: Its real-time listeners are essential for automatically updating leaderboards and portfolio values across all clients simultaneously. The flexible data model is well-suited for the application's needs.

Serverless Backend: Cloud Functions for Firebase

Function: Used to run backend code in response to events or on a schedule, without managing a server.

Reasoning: Essential for offloading tasks from the client, such as the periodic fetching of stock market data.

4. Data Fetching Architecture (Hybrid Model)

To balance API usage, cost, and real-time accuracy, the application uses a hybrid data-fetching model.

Path 1: Server-Side Background Refresh (for Owned Stocks)

A scheduled Cloud Function (updateMarketData) runs every 10 minutes.

It queries the entire database to find all unique stock symbols currently held by any player in any competition.

It makes a single API call to Alpha Vantage for each unique symbol.

It stores the results in a centralized /market_data/{symbol} collection in Firestore.

Benefit: Massively reduces API calls and ensures portfolio data for active games is updated efficiently and consistently for all users.

Path 2: Client-Side On-Demand Fetch (for New Trades)

When a user searches for a stock they do not own or opens the trade modal, the client makes a direct, live API call to Alpha Vantage.

Benefit: Ensures the user sees the most current, up-to-the-second price before making a trade, which is critical for a fair user experience.

5. Deployment & Setup Notes

Firebase UI Bug Workaround:

Issue: During setup, the Firebase web console's "Create function" UI was inaccessible due to a persistent, unresolvable project configuration bug.

Solution: The updateMarketData Cloud Function was deployed using the Google Cloud Shell Editor. This is the recommended professional-grade tool for bypassing such UI issues.

Reference: The deployment process is documented in the guide titled "Guide: Deploying a Function with Google Cloud Shell".

