# Atomic Void

## Overview

Atomic Void is your interface to a suite of services to manage an adults' home.
Designed as a set of microservices, Atomic Void runs on your home Wi-fi and is
completely isolated to itself. So your data does not leave the system!

## Products

- Home Inventory (In Progress): Track items like toiletries, ingredients, and perishables
  right from your phone.
- Ryoiki Tenkai Frontend (In Progress): The portal to the Atomic Void suite of products.
  "Ryoiki Tenkai" comes from the popular anime Jujutsu Kaisen in which a character
  creates their domain. As such, this product is _your_ domain!

## Structure

There are two key elements that make up the structure of the Atomic Void monorepo

### Microservices

Microservices is where all the, well, microservices live. These are all the products that make up the Atomic Void Suite.

### Platform

The platform directory houses common code for reuse across all microservices. This includes a barebones Express application to copy/paste to create a new Atomic Void App, and interfaces to interact with the message broker and database deployments.

## Key Technology Used

For anyone curious to the stack, the following are the key technologies used for this project

- Node: All products are Node applications with Rest API interfaces
- Express.js: Express for routing and creating the Rest API interface
- Next.js/React: Next JS is used to create any frontends and UIs
- Postgres: The relational database for structured data
- MongoDB: The NoSQL database for unstructured data
- Confluent Platform (Kafka): Enables pub/sub communication across microservices so the state of the platform can be inferred.
