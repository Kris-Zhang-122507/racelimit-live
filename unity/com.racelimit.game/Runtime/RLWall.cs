using UnityEngine;

namespace RaceLimit
{
    // A barrier's collider (the invisible wall strips): slides a car along it rather than catching it.
    public class RLWall : MonoBehaviour
    {
        static PhysicsMaterial mat;
        public static PhysicsMaterial Material
        {
            get
            {
                if (mat == null) mat = new PhysicsMaterial("RL_Wall") { dynamicFriction = 0.25f, staticFriction = 0.3f, bounciness = 0.12f, frictionCombine = PhysicsMaterialCombine.Average, bounceCombine = PhysicsMaterialCombine.Average };
                return mat;
            }
        }
        void Awake() { var c = GetComponent<Collider>(); if (c != null) c.sharedMaterial = Material; }
    }
}
