from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("ERROR: OPENAI_API_KEY not found in environment variables!")
    print("Please add it to your .env file: OPENAI_API_KEY=your_key_here")
    sys.exit(1)

client = OpenAI(api_key=openai_api_key)

# MongoDB connection with proper error handling
mongo_uri = os.getenv('MONGO_URI')
mongo_db = os.getenv('MONGO_DB')

if not mongo_uri:
    print("ERROR: MONGO_URI not found in environment variables!")
    print("Please add it to your .env file")
    sys.exit(1)

if not mongo_db:
    print("ERROR: MONGO_DB not found in environment variables!")
    print("Please add it to your .env file")
    sys.exit(1)

try:
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client[mongo_db]
    # Test connection
    mongo_client.server_info()
    print(f"✓ Connected to MongoDB: {mongo_db}")
except Exception as e:
    print(f"ERROR: Failed to connect to MongoDB: {e}")
    sys.exit(1)

# Store conversation history (in-memory for MVP)
conversation_histories = {}

# Model selection
MODEL = "gpt-4o-mini"  # Recommended: Fast and cost-effective

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    """
    data = request.json
    user_message = data.get('message', '')
    username = data.get('username', '')
    context = data.get('context', {})
    
    if not user_message or not username:
        return jsonify({
            "response": "I didn't receive a message. Please try again!",
            "success": False
        }), 400
    
    # Get or create conversation history
    if username not in conversation_histories:
        conversation_histories[username] = []
    
    # Fetch user fitness data for context
    user_context = get_user_fitness_context(username)
    
    # Build system prompt based on current screen and user data
    system_prompt = build_system_prompt(context, user_context)
    
    # Add user message to history
    conversation_histories[username].append({
        "role": "user",
        "content": user_message
    })
    
    try:
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt}
        ] + conversation_histories[username][-10:]  # Keep last 10 messages
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=150,
            temperature=0.7,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        assistant_message = response.choices[0].message.content
        
       # Add assistant response to history
        conversation_histories[username].append({
            "role": "assistant",
            "content": assistant_message
        })
        
        # Get fresh suggestions for follow-up
        user_ctx = get_user_fitness_context(username)
        fresh_suggestions = get_dynamic_suggestions(
            context.get('screen', 'general'),
            conversation_histories[username],
            user_ctx
        )
        
        # Calculate cost (optional)
        usage = response.usage
        cost_info = calculate_cost(usage, MODEL)
        
        return jsonify({
            "response": assistant_message,
            "success": True,
            "suggestions": fresh_suggestions,  # Add this line
            "usage": {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
                "estimated_cost": cost_info
            }
        })
        
    except Exception as e:
        print(f"OpenAI API Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error response
        return jsonify({
            "response": "I'm having trouble connecting right now. Please try again! 😊",
            "success": False,
            "error": str(e)
        }), 500

def calculate_cost(usage, model):
    """Calculate estimated cost based on token usage"""
    pricing = {
        "gpt-4o-mini": {
            "input": 0.150 / 1_000_000,
            "output": 0.600 / 1_000_000
        },
        "gpt-4o": {
            "input": 2.50 / 1_000_000,
            "output": 10.00 / 1_000_000
        },
        "gpt-3.5-turbo": {
            "input": 0.50 / 1_000_000,
            "output": 1.50 / 1_000_000
        }
    }
    
    model_pricing = pricing.get(model, pricing["gpt-4o-mini"])
    input_cost = usage.prompt_tokens * model_pricing["input"]
    output_cost = usage.completion_tokens * model_pricing["output"]
    total_cost = input_cost + output_cost
    
    return {
        "input_cost": round(input_cost, 6),
        "output_cost": round(output_cost, 6),
        "total_cost": round(total_cost, 6)
    }

def get_user_fitness_context(username):
    """Fetch user's fitness data from MongoDB"""
    try:
        # Get current week (Monday to today) - matching Journal "This Week"
        today = datetime.now()
        days_since_monday = today.weekday()  # 0 = Monday, 6 = Sunday
        week_start = today - timedelta(days=days_since_monday)
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        print(f"\n{'='*60}")
        print(f"🔍 FETCHING DATA FOR: {username}")
        print(f"📅 This week (Mon-Today): {week_start.date()} to {today.date()}")
        
        activities = list(db.exercises.find({
            "username": username,
            "date": {"$gte": week_start}
        }).sort("date", -1))  # Get ALL activities this week
        
        print(f"📊 Found {len(activities)} activities this week")
        if activities:
            print("Recent activities:")
            for a in activities[:5]:
                print(f"  • {a.get('exerciseType')}: {a.get('duration')} min on {a.get('date')}")
        else:
            print("  ⚠️ No activities found!")
        
        # Get all-time stats (not just this week)
        pipeline = [
            {"$match": {"username": username}},
            {"$group": {
                "_id": "$exerciseType",
                "totalDuration": {"$sum": "$duration"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"totalDuration": -1}},
            {"$limit": 5}
        ]
        stats = list(db.exercises.aggregate(pipeline))
        
        print(f"📈 All-time stats:")
        for s in stats:
            print(f"  • {s['_id']}: {s['totalDuration']} min ({s['count']} sessions)")
        
        # Calculate total workout time THIS WEEK
        weekly_pipeline = [
            {"$match": {
                "username": username,
                "date": {"$gte": week_start}
            }},
            {"$group": {
                "_id": None,
                "totalDuration": {"$sum": "$duration"}
            }}
        ]
        weekly_total = list(db.exercises.aggregate(weekly_pipeline))
        weekly_minutes = weekly_total[0]["totalDuration"] if weekly_total else 0
        
        print(f"⏱️  This week total: {weekly_minutes} minutes")
        print(f"{'='*60}\n")
        
                # Get THIS WEEK's breakdown by exercise type
        weekly_breakdown_pipeline = [
            {"$match": {
                "username": username,
                "date": {"$gte": week_start}
            }},
            {"$group": {
                "_id": "$exerciseType",
                "totalDuration": {"$sum": "$duration"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"totalDuration": -1}}
        ]
        weekly_breakdown = list(db.exercises.aggregate(weekly_breakdown_pipeline))

        print(f"📊 This week's breakdown:")
        for wb in weekly_breakdown:
            print(f"  • {wb['_id']}: {wb['totalDuration']} min ({wb['count']} sessions)")
            
        return {
            "recent_activities": [
                {
                    "type": a.get("exerciseType", "Unknown"),
                    "duration": a.get("duration", 0),
                    "date": a.get("date", datetime.now()).strftime("%Y-%m-%d") if isinstance(a.get("date"), datetime) else str(a.get("date", ""))
                }
                for a in activities[:10]  # Show last 10
            ],
            "stats": [
                {
                    "type": s["_id"],
                    "total_duration": s["totalDuration"],
                    "count": s["count"]
                }
                for s in stats
            ],
            "weekly_breakdown": [  # NEW - This week's breakdown
                {
                    "type": wb["_id"],
                    "duration": wb["totalDuration"],
                    "count": wb["count"]
                }
                for wb in weekly_breakdown
            ],
            "total_activities": len(activities),
            "weekly_minutes": weekly_minutes
        }
    except Exception as e:
        print(f"❌ Error fetching user context: {e}")
        import traceback
        traceback.print_exc()
        return {
            "recent_activities": [],
            "stats": [],
            "total_activities": 0,
            "weekly_minutes": 0
        }

def build_system_prompt(context, user_context):
    """Build context-aware system prompt"""
    screen = context.get('screen', 'general')
    
    # Format recent activities with clearer labels and hour conversion
    recent_activities_str = ""
    if user_context['recent_activities']:
        formatted_activities = []
        for i, a in enumerate(user_context['recent_activities'][:5]):
            duration_mins = a['duration']
            if duration_mins >= 60:
                hours = duration_mins // 60
                mins = duration_mins % 60
                if mins > 0:
                    duration_str = f"{hours} hr {mins} min"
                else:
                    duration_str = f"{hours} hr"
            else:
                duration_str = f"{duration_mins} min"
            
            formatted_activities.append(f"{i+1}. {a['type']}: {duration_str} on {a['date']}")
        
        recent_activities_str = "NEWEST → OLDEST:\n" + "\n".join(formatted_activities)
    else:
        recent_activities_str = "No recent activities logged yet."
    
    # Format THIS WEEK's breakdown (not all-time)
    weekly_breakdown_str = ""
    if user_context.get('weekly_breakdown'):
        formatted_weekly = []
        for wb in user_context['weekly_breakdown']:
            mins = wb['duration']
            hours = mins // 60
            remaining_mins = mins % 60
            
            if hours > 0:
                time_str = f"{hours} hr {remaining_mins} min"
            else:
                time_str = f"{mins} min"
            
            formatted_weekly.append(f"- {wb['type']}: {time_str} ({wb['count']} sessions)")
        
        weekly_breakdown_str = "\n".join(formatted_weekly)
    else:
        weekly_breakdown_str = "No activities this week yet."
    
    # Convert weekly minutes to hours and minutes
    weekly_mins = user_context['weekly_minutes']
    hours = weekly_mins // 60
    mins = weekly_mins % 60
    if hours > 0:
        time_display = f"{hours} hr {mins} min"
    else:
        time_display = f"{mins} min"
    
    base_prompt = f"""You are FitCoach, a friendly and motivating AI fitness assistant for the MLA Fitness App.

THIS WEEK'S PROGRESS (Monday - Today):
- Total workout time: {time_display}
- Total activities logged: {user_context['total_activities']}

WEEKLY BREAKDOWN (Total duration by activity type):
{weekly_breakdown_str}

MOST RECENT ACTIVITIES (Individual sessions, newest first):
{recent_activities_str}

IMPORTANT DATA NOTES:
- "Weekly breakdown" shows TOTAL time per activity type (sum of all sessions)
- "Most recent activities" shows INDIVIDUAL workout sessions in chronological order
- When asked about "most recent" or "latest" activity, refer to the TOP item in recent activities list
- The top recent activity is the NEWEST, the last one is OLDEST

⚠️ DATA SANITY CHECKS - CRITICAL:
- If you see workout durations over 3 hours, it's likely a DATA ERROR (user meant minutes, not hours)
- A typical workout is 15-90 minutes. Anything over 3 hours is extreme/unusual
- When creating workout plans, NEVER suggest sessions longer than 90 minutes
- If you notice unrealistic data (like 20 hr running), acknowledge it but suggest realistic alternatives
- Example: "I see 20hr logged - that seems like it might be a typo! For running, 20-60 min sessions are great."

YOUR RESPONSE STYLE - CRITICAL:
- MAXIMUM 1-2 SHORT SENTENCES (like texting a friend)
- Give ONE specific actionable tip, never multiple suggestions
- Use numbers from their data BUT apply common sense
- When creating workout plans, be REALISTIC (15-60 min per session typical, max 90 min)
- Durations are pre-formatted (e.g., "20 hr") - use them EXACTLY as shown, but flag if unrealistic
- NEVER convert or recalculate times - they're already in the best format
- Be enthusiastic but brief
- Max 1 emoji per message

EMOJI USAGE GUIDE:
- Running: 🏃 or 🏃‍♀️
- Swimming: 🏊 or 🏊‍♀️ (NOT 🤿)
- Cycling: 🚴 or 🚴‍♀️
- Gym/Strength: 💪 or 🏋️
- Yoga: 🧘 or 🧘‍♀️
- General fitness: 🔥, ⚡, 🎯
- Celebration: 🎉, 🏆, ⭐

WORKOUT PLAN GUIDELINES:
- Individual sessions: 15-60 minutes (never exceed 90 minutes)
- Weekly total: 150-300 minutes for general fitness
- Include 1-2 rest days per week
- Balance cardio, strength, and flexibility
- Suggest progressive overload (gradually increase intensity)
- Be realistic and sustainable

Remember: Be concise, specific, and friendly. Short responses only.
"""

    # Screen-specific context
    if screen == "trackExercise":
        base_prompt += """
\nSCREEN: Track Exercise page
Help users log their workouts effectively and suggest what they should do next based on this week's activities.
"""
    elif screen == "statistics":
        base_prompt += """
\nSCREEN: Statistics dashboard
Help users interpret their charts and understand THIS WEEK's progress.
"""
    elif screen == "journal":
        base_prompt += """
\nSCREEN: Journal page
Help users review THIS WEEK's history and plan future workouts.
"""
    
    return base_prompt

def get_dynamic_suggestions(screen, conversation_history, user_context):
    """Get context-aware suggestions based on conversation, avoiding recent questions"""
    
    # Check what was recently discussed
    recent_messages = conversation_history[-6:] if len(conversation_history) > 0 else []
    recent_text = " ".join([msg.get("content", "").lower() for msg in recent_messages])
    
    # Extract recent user questions to avoid repeating them
    recent_questions = set()
    for msg in recent_messages:
        if msg.get("role") == "user":
            question = msg.get("content", "").lower().strip()
            # Store normalized version
            recent_questions.add(question)
    
    # Get user data insights
    has_activities = user_context.get('total_activities', 0) > 0
    weekly_mins = user_context.get('weekly_minutes', 0)
    has_limited_data = user_context.get('total_activities', 0) <= 3
    
    # Helper function to filter out recently asked questions
    def filter_recent(suggestions):
        filtered = []
        for suggestion in suggestions:
            # Normalize suggestion for comparison
            normalized = suggestion.lower().replace("?", "").replace("!", "").replace("💪", "").replace("📊", "").replace("🎯", "").replace("🏆", "").replace("📈", "").replace("🔥", "").replace("⚡", "").replace("🎉", "").replace("📅", "").replace("🌅", "").replace("⏰", "").replace("🧘", "").replace("🗓️", "").strip()
            
            # Check if this suggestion is similar to recent questions
            is_recent = False
            for recent_q in recent_questions:
                recent_normalized = recent_q.lower().replace("?", "").replace("!", "").strip()
                # Check for similarity (not exact match, but key words)
                if normalized in recent_normalized or recent_normalized in normalized:
                    is_recent = True
                    break
            
            if not is_recent:
                filtered.append(suggestion)
        
        # If we filtered out too many, return some anyway (but still avoid exact matches)
        if len(filtered) < 2:
            return [s for s in suggestions if s.lower().strip() not in recent_questions][:4]
        
        return filtered[:4]
    
    # If this is the first interaction (no conversation history), provide fresh start suggestions
    if len(conversation_history) <= 2:  # Just greeting exchange
        if has_limited_data:
            return [
                "What's a good workout for today? 💪",
                "Help me set a weekly goal 🎯",
                "Give me motivation to start!",
                "How often should I workout?"
            ]
        else:
            return [
                "How am I doing this week? 📊",
                "What's my strongest activity? 💪",
                "Give me a workout challenge! ⚡",
                "Help me stay motivated 🔥"
            ]
    
    # Determine what user just talked about and provide DIFFERENT follow-ups
    if "strongest" in recent_text or "top" in recent_text or "best" in recent_text:
        candidates = [
            "Where can I improve?",
            "How's my workout variety?",
            "Set a goal for next week",
            "What's my weakest area?",
            "What should I add to my routine?",
            "Am I being consistent?",
            "Plan a balanced week for me"
        ]
        return filter_recent(candidates)
    
    elif "improve" in recent_text or "better" in recent_text or "variety" in recent_text:
        candidates = [
            "Create a weekly workout plan 📅",
            "What's a good 30-min challenge?",
            "How often should I rest?",
            "Suggest a new exercise to try",
            "How do I prevent burnout?",
            "What time is best to workout?",
            "Balance cardio and strength for me"
        ]
        return filter_recent(candidates)
    
    elif "last workout" in recent_text or "recent" in recent_text or "latest" in recent_text:
        candidates = [
            "How's my weekly progress? 📊",
            "What should I do tomorrow?",
            "Plan my next 3 workouts",
            "Give me a different workout idea",
            "What's my workout streak? 🔥",
            "Should I take a rest day?",
            "When did I last do strength?"
        ]
        return filter_recent(candidates)
    
    elif "progress" in recent_text or "doing" in recent_text or "week" in recent_text:
        if has_limited_data:
            # Limited data - focus on current week and future goals
            candidates = [
                "What should I focus on next? 🎯",
                "Set a weekly goal for me",
                "Give me a workout challenge",
                "How can I stay consistent?",
                "What's a good next step?",
                "Help me build momentum! 🔥",
                "Create a workout schedule"
            ]
        else:
            # Sufficient data - can compare and analyze
            candidates = [
                "What's my most improved activity? 📈",
                "Set a new personal goal",
                "Compare my weeks",
                "What's my weekly average?",
                "How consistent am I?",
                "Show me my best week",
                "What should I focus on next?"
            ]
        return filter_recent(candidates)
    
    elif "motivate" in recent_text or "tip" in recent_text or "advice" in recent_text:
        candidates = [
            "What's a realistic weekly goal? 🎯",
            "How do I build a workout habit?",
            "Give me a challenge! ⚡",
            "What time of day is best?",
            "How do I stay accountable?",
            "Celebrate my wins! 🎉",
            "What's my next milestone?"
        ]
        return filter_recent(candidates)
    
    elif "workout" in recent_text or "exercise" in recent_text or "routine" in recent_text:
        candidates = [
            "How long should I rest between sessions?",
            "What's a good warm-up?",
            "Should I do cardio or strength?",
            "Create a full-body routine",
            "What exercises pair well?",
            "How do I avoid soreness?",
            "Suggest a recovery day activity"
        ]
        return filter_recent(candidates)
    
    elif "goal" in recent_text or "plan" in recent_text or "schedule" in recent_text:
        candidates = [
            "How do I track my goals?",
            "What's a good monthly target?",
            "Set reminders for me",
            "When will I see results?",
            "Help me stay on track",
            "Plan my workout week",
            "What's achievable this month?"
        ]
        return filter_recent(candidates)
    
    elif "consistent" in recent_text or "consistency" in recent_text:
        candidates = [
            "What's my workout streak? 🔥",
            "How do I build discipline?",
            "What are my peak workout days?",
            "Should I workout on weekends?",
            "How often do I skip?",
            "Set a consistency goal",
            "What time do I usually workout?"
        ]
        return filter_recent(candidates)
    
    elif "thanks" in recent_text or "thank" in recent_text or "great" in recent_text or "awesome" in recent_text:
        import random
        suggestions_pool = [
            ["What should I focus on tomorrow? 🌅", "Give me a recovery tip", "How's my workout balance?", "Plan my week ahead"],
            ["Suggest a new exercise to try", "How do I prevent injuries?", "What's a fun workout idea?", "Set a new challenge for me"],
            ["When's the best time to workout? ⏰", "How do I stay motivated?", "What's a good warm-up?", "Challenge me! ⚡"],
            ["Give me a stretching routine 🧘", "How often should I rest?", "What exercises work together?", "Plan tomorrow's workout"],
            ["What's my next milestone? 🎯", "Create a 7-day plan", "How do I level up?", "Give me a fitness tip"],
            ["What should I try next?", "Help me stay on track", "How do I avoid burnout?", "Suggest a fun activity"]
        ]
        return filter_recent(random.choice(suggestions_pool))
    
    else:
        # Get varied default suggestions based on user's activity level
        candidates = get_varied_default_suggestions(screen, user_context, weekly_mins, has_activities)
        return filter_recent(candidates)
    
    
def get_varied_default_suggestions(screen, user_context, weekly_mins, has_activities):
    """Get varied default suggestions that change based on user's activity"""
    import random
    
    # Define multiple suggestion sets per screen
    suggestion_sets = {
        "trackExercise": [
            ["What's a good workout for today? 💪", "How long should I exercise?", "Suggest a quick 15-min routine", "What burns the most calories?"],
            ["Plan a full-body workout", "What exercises target abs?", "Give me a cardio challenge", "How do I warm up properly?"],
            ["Create a strength training plan", "What's good for beginners?", "Suggest HIIT exercises", "How often should I workout?"],
            ["What's a good cool-down routine?", "Mix cardio and strength for me", "Suggest outdoor activities", "How do I prevent soreness?"]
        ] if has_activities else [
            ["How do I get started? 🎯", "What's a good beginner workout?", "How do I log my first exercise?", "I've never worked out before"],
            ["What equipment do I need?", "How long for my first workout?", "Is walking enough exercise?", "Give me confidence to start!"],
            ["What's the easiest workout?", "How do I avoid injury as a beginner?", "Set a simple first goal", "Motivate me to begin! 💪"]
        ],
        
        "statistics": [
            ["How am I doing this week? 📊", "What's my most frequent activity?", "Am I improving over time?", "Compare my weeks"],
            ["What's my weekly average? 📈", "Show me my best day", "Am I consistent enough?", "How's my workout variety?"],
            ["What's my longest session? 🏆", "Track my progress trend", "What activity am I neglecting?", "Set a new record!"],
            ["How many calories burned? 🔥", "What's my total workout time?", "Am I meeting my goals?", "Show me monthly stats"]
        ],
        
        "journal": [
            ["Show me my workout patterns 🗓️", "What are my peak days?", "How often do I skip workouts?", "Review this month"],
            ["What's my favorite workout day? 📅", "How's my consistency?", "Find gaps in my routine", "What time do I usually workout?"],
            ["Compare this week to last", "Show my busiest workout week", "How do weekends differ?", "Track my rest days"],
            ["What's my workout streak? 🔥", "When did I last rest?", "Plan next week's schedule", "Set reminders for me"]
        ],
        
        "general": [
            ["How do I track progress? 🎯", "Give me a fitness tip!", "What should I focus on?", "Create a weekly plan"],
            ["How can I stay motivated? 💪", "What's a realistic goal?", "How do I build discipline?", "Celebrate my wins! 🎉"],
            ["What's the secret to consistency?", "How do I avoid burnout?", "Balance cardio and strength", "When will I see results?"],
            ["Give me a challenge! ⚡", "How do I level up?", "What's my next milestone?", "Keep me accountable!"]
        ]
    }
    
    # Choose different sets based on weekly activity level
    screen_suggestions = suggestion_sets.get(screen, suggestion_sets["general"])
    
    if weekly_mins < 60:
        # Low activity - encouraging
        return screen_suggestions[0]
    elif weekly_mins < 180:
        # Moderate activity - progressing
        return random.choice(screen_suggestions[:2])
    else:
        # High activity - advanced
        return random.choice(screen_suggestions)

def get_default_suggestions(screen, user_context):
    """Get default suggestions for each screen"""
    
    # Personalize based on user data
    has_activities = user_context.get('total_activities', 0) > 0
    weekly_mins = user_context.get('weekly_minutes', 0)
    
    return get_varied_default_suggestions(screen, user_context, weekly_mins, has_activities)

@app.route('/api/chat/suggestions', methods=['GET'])
def get_suggestions():
    """Get contextual quick suggestions"""
    screen = request.args.get('screen', 'general')
    username = request.args.get('username', '')
    
    # Get user context for personalization
    user_context = get_user_fitness_context(username) if username else {}
    
    # Get conversation history for dynamic suggestions
    conversation_history = conversation_histories.get(username, [])
    
    # Get dynamic suggestions based on conversation
    suggestions = get_dynamic_suggestions(screen, conversation_history, user_context)
    
    return jsonify({
        "suggestions": suggestions
    })

@app.route('/api/chat/reset', methods=['POST'])
def reset_conversation():
    """Reset conversation history"""
    username = request.json.get('username', '')
    if username in conversation_histories:
        del conversation_histories[username]
    return jsonify({"success": True, "message": "Conversation reset"})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "chatbot",
        "model": MODEL,
        "mongodb_connected": True,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.getenv('CHATBOT_PORT', 5052))
    print(f"\n{'='*50}")
    print(f"🤖 FitCoach Chatbot Service Starting...")
    print(f"{'='*50}")
    print(f"✓ OpenAI Model: {MODEL}")
    print(f"✓ MongoDB: {mongo_db}")
    print(f"✓ Port: {port}")
    print(f"{'='*50}\n")
    
    app.run(debug=True, port=port, host='0.0.0.0')