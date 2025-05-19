# backend/mcp/routes/integrations/spotify_routes.py
from fastapi import APIRouter, Request, HTTPException
import requests
import base64
import os

